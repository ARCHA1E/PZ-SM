#!/usr/bin/env bash
# Run on a Proxmox VE host: creates a Debian 12 LXC sized for a Project Zomboid B42 server
# and installs PZSM natively inside it (systemd, no Docker).
#
#   ./install/pve-create-lxc.sh                       # from a checkout on the PVE host
#   PZSM_REPO=https://github.com/<you>/pzsm.git ./pve-create-lxc.sh
#
# Knobs (environment): CTID, CT_HOSTNAME, CT_STORAGE, CT_TEMPLATE_STORAGE, CT_BRIDGE,
# CT_IP (dhcp | 192.168.1.50/24), CT_GW, CT_CORES, CT_MEMORY (MB), CT_SWAP, CT_DISK (GB),
# PZSM_ADMIN_PASSWORD, PZ_MAX_MEMORY.
set -euo pipefail

command -v pct >/dev/null || { echo "Run this on a Proxmox VE host." >&2; exit 1; }

CTID=${CTID:-$(pvesh get /cluster/nextid)}
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
[ -n "${CT_GW:-}" ] && NET="${NET},gw=${CT_GW}"

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../pnpm-workspace.yaml" ]; then
  echo "==> Copying PZSM source into the container"
  TMP=$(mktemp --suffix .tar.gz)
  tar -C "$SCRIPT_DIR/.." --exclude=node_modules --exclude=dist --exclude=.git --exclude=data -czf "$TMP" .
  pct exec "$CTID" -- mkdir -p /usr/local/src/pzsm
  pct push "$CTID" "$TMP" /tmp/pzsm-src.tar.gz
  rm -f "$TMP"
  pct exec "$CTID" -- tar -xzf /tmp/pzsm-src.tar.gz -C /usr/local/src/pzsm
  pct exec "$CTID" -- env PZSM_ADMIN_PASSWORD="${PZSM_ADMIN_PASSWORD:-}" PZ_MAX_MEMORY="$PZ_MAX_MEMORY" PZ_SERVER_NAME="$CT_HOSTNAME" \
    bash /usr/local/src/pzsm/install/lxc-install.sh
else
  [ -n "${PZSM_REPO:-}" ] || { echo "Set PZSM_REPO or run from a checkout" >&2; exit 1; }
  pct exec "$CTID" -- bash -c "apt-get update -qq && apt-get install -y -qq git ca-certificates >/dev/null && git clone -q '$PZSM_REPO' /usr/local/src/pzsm"
  pct exec "$CTID" -- env PZSM_ADMIN_PASSWORD="${PZSM_ADMIN_PASSWORD:-}" PZ_MAX_MEMORY="$PZ_MAX_MEMORY" PZ_SERVER_NAME="$CT_HOSTNAME" \
    bash /usr/local/src/pzsm/install/lxc-install.sh
fi

IP=$(pct exec "$CTID" -- hostname -I | awk '{print $1}')
echo "==> Ready: http://${IP}:8080  (container $CTID)"
echo "    Forward UDP 16261-16262 to ${IP} for players outside your LAN."
