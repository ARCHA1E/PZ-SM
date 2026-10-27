#!/usr/bin/env bash
# Run on a Proxmox VE host: creates a Debian 12 LXC sized for a Project Zomboid B42 server
# and installs PZ-SM from GitHub inside it (systemd, no Docker).
#
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/ARCHA1E/PZ-SM/main/install/pve-create-lxc.sh)"
#
# You are asked for the container ID (or pass CTID=<id>); it is never picked automatically.
#
# Knobs (environment): CTID, CT_HOSTNAME, CT_STORAGE, CT_TEMPLATE_STORAGE, CT_BRIDGE,
# CT_IP (dhcp | 192.168.1.50/24), CT_GW, CT_CORES, CT_MEMORY (MB), CT_SWAP, CT_DISK (GB),
# PZSM_ADMIN_PASSWORD, PZ_MAX_MEMORY,
# PZSM_REPO / PZSM_REF (install a fork or a specific branch/tag; default ARCHA1E/PZ-SM main),
# PZSM_SRC (path to a local checkout on this host to install instead of GitHub; development).
set -euo pipefail

command -v pct >/dev/null || { echo "Run this on a Proxmox VE host." >&2; exit 1; }

# The container ID is always chosen by the user: from CTID=..., or asked interactively.
ctid_in_use() { compgen -G "/etc/pve/nodes/*/lxc/$1.conf" >/dev/null || compgen -G "/etc/pve/nodes/*/qemu-server/$1.conf" >/dev/null; }
ctid_valid() {
  if ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 100 ] || [ "$1" -gt 999999999 ]; then
    echo "    '$1' is not a valid ID (a whole number from 100 to 999999999)." >&2
    return 1
  fi
  if ctid_in_use "$1"; then
    echo "    ID $1 is already used by another container or VM." >&2
    return 1
  fi
}
if [ -n "${CTID:-}" ]; then
  ctid_valid "$CTID" || exit 1
elif { : </dev/tty; } 2>/dev/null; then
  SUGGEST=$(pvesh get /cluster/nextid 2>/dev/null || true)
  while :; do
    read -r -p "Container ID for the new LXC${SUGGEST:+ (next free: $SUGGEST)}: " CTID </dev/tty
    [ -n "$CTID" ] && ctid_valid "$CTID" && break
  done
else
  echo "No terminal to ask on; set the container ID explicitly, e.g. CTID=250." >&2
  exit 1
fi

CT_HOSTNAME=${CT_HOSTNAME:-pzserver}
CT_STORAGE=${CT_STORAGE:-local-lvm}
CT_TEMPLATE_STORAGE=${CT_TEMPLATE_STORAGE:-local}
CT_BRIDGE=${CT_BRIDGE:-vmbr0}
CT_IP=${CT_IP:-dhcp}
CT_CORES=${CT_CORES:-4}
CT_MEMORY=${CT_MEMORY:-12288}
CT_SWAP=${CT_SWAP:-2048}
CT_DISK=${CT_DISK:-40}
PZ_MAX_MEMORY=${PZ_MAX_MEMORY:-$(( (CT_MEMORY - 3072) / 1024 ))g}

echo "==> Container $CTID ($CT_HOSTNAME): ${CT_CORES} cores, ${CT_MEMORY} MB RAM, ${CT_DISK} GB disk, Java heap ${PZ_MAX_MEMORY}"

pveam update >/dev/null
TEMPLATE=$(pveam available --section system | awk '/debian-12-standard/ {print $2}' | sort -V | tail -1)
[ -n "$TEMPLATE" ] || { echo "No debian-12-standard template found" >&2; exit 1; }
if ! pveam list "$CT_TEMPLATE_STORAGE" | grep -q "$TEMPLATE"; then
  echo "==> Downloading $TEMPLATE"
  pveam download "$CT_TEMPLATE_STORAGE" "$TEMPLATE" >/dev/null
fi

NET="name=eth0,bridge=${CT_BRIDGE},ip=${CT_IP}"
if [ -n "${CT_GW:-}" ]; then NET="${NET},gw=${CT_GW}"; fi

pct create "$CTID" "${CT_TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}" \
  --hostname "$CT_HOSTNAME" \
  --cores "$CT_CORES" --memory "$CT_MEMORY" --swap "$CT_SWAP" \
  --rootfs "${CT_STORAGE}:${CT_DISK}" \
  --net0 "$NET" \
  --unprivileged 1 --features nesting=1 \
  --onboot 1 --start 1 \
  --description "Project Zomboid B42 server managed by PZSM"

echo "==> Waiting for network"
for _ in $(seq 1 60); do
  pct exec "$CTID" -- bash -c 'getent hosts deb.debian.org >/dev/null' && break
  sleep 2
done

PZSM_REPO=${PZSM_REPO:-https://github.com/ARCHA1E/PZ-SM.git}
PZSM_REF=${PZSM_REF:-main}
INSTALL_ENV=(PZSM_ADMIN_PASSWORD="${PZSM_ADMIN_PASSWORD:-}" PZ_MAX_MEMORY="$PZ_MAX_MEMORY" PZ_SERVER_NAME="$CT_HOSTNAME" PZSM_REPO="$PZSM_REPO" PZSM_REF="$PZSM_REF")

if [ -n "${PZSM_SRC:-}" ]; then
  echo "==> Copying local source $PZSM_SRC into the container"
  TMP=$(mktemp --suffix .tar.gz)
  tar -C "$PZSM_SRC" --exclude=node_modules --exclude=dist --exclude=.git --exclude=data -czf "$TMP" .
  pct exec "$CTID" -- mkdir -p /usr/local/src/pzsm-local
  pct push "$CTID" "$TMP" /tmp/pzsm-src.tar.gz
  rm -f "$TMP"
  pct exec "$CTID" -- tar -xzf /tmp/pzsm-src.tar.gz -C /usr/local/src/pzsm-local
  pct exec "$CTID" -- env "${INSTALL_ENV[@]}" PZSM_SRC=/usr/local/src/pzsm-local bash /usr/local/src/pzsm-local/install/lxc-install.sh
else
  # Repo URL → raw URL of the installer at the same ref (works for GitHub forks too).
  RAW_BASE=$(printf '%s' "$PZSM_REPO" | sed -E 's#^https://github.com/#https://raw.githubusercontent.com/#; s#\.git$##')
  echo "==> Installing PZ-SM from $PZSM_REPO ($PZSM_REF)"
  pct exec "$CTID" -- bash -c "apt-get update -qq && apt-get install -y -qq curl ca-certificates >/dev/null"
  pct exec "$CTID" -- env "${INSTALL_ENV[@]}" bash -c "curl -fsSL '$RAW_BASE/$PZSM_REF/install/lxc-install.sh' -o /root/lxc-install.sh && bash /root/lxc-install.sh"
fi

IP=$(pct exec "$CTID" -- hostname -I | awk '{print $1}')
echo "==> Ready: http://${IP}:8080  (container $CTID)"
echo "    Forward UDP 16261-16262 to ${IP} for players outside your LAN."
echo "    Upgrade later with: pct exec $CTID -- bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/ARCHA1E/PZ-SM/main/install/lxc-install.sh)\""
