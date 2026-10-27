#!/usr/bin/env bash
# PZSM native installer for a Debian 12/13 or Ubuntu 22.04+ LXC container or VM (no Docker).
#
# Run as root inside the container; it downloads PZ-SM from GitHub:
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/ARCHA1E/PZ-SM/main/install/lxc-install.sh)"
#
# Re-running the script upgrades PZSM to the latest version in place (data is kept).
#
# Environment knobs:
#   PZSM_REPO            git URL to install from (default: https://github.com/ARCHA1E/PZ-SM.git)
#   PZSM_REF             branch, tag or commit to install (default: main)
#   PZSM_SRC             install from this local checkout instead of GitHub (development)
#   PZSM_PORT            panel port (default 8080)
#   PZSM_ADMIN_PASSWORD  initial panel password (else set it in the browser)
#   PZ_SERVER_NAME       initial server name (default pzserver)
#   PZ_MAX_MEMORY        initial Java heap (default 8g)
#   PZSM_AUTO_INSTALL    1 = install the game server on first start (default 1)
set -euo pipefail

APP_DIR=/opt/pzsm
DATA_DIR=/var/lib/pzsm
STEAMCMD_DIR=/opt/steamcmd
ENV_FILE=/etc/pzsm.env
SERVICE=/etc/systemd/system/pzsm.service
NODE_MAJOR=22
PZSM_REPO=${PZSM_REPO:-https://github.com/ARCHA1E/PZ-SM.git}
PZSM_REF=${PZSM_REF:-main}

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run as root"
command -v apt-get >/dev/null || die "this installer supports Debian/Ubuntu (apt) only"
[ "$(uname -m)" = "x86_64" ] || die "Project Zomboid dedicated server requires x86_64"

export DEBIAN_FRONTEND=noninteractive

log "Installing system packages"
dpkg --add-architecture i386
apt-get update -qq
apt-get install -y -qq --no-install-recommends \
  ca-certificates curl gnupg git tar xz-utils procps locales \
  lib32gcc-s1 lib32stdc++6 build-essential python3 >/dev/null
sed -i 's/^# *en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen >/dev/null || true

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$NODE_MAJOR" ]; then
  log "Installing Node.js ${NODE_MAJOR}"
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update -qq && apt-get install -y -qq nodejs >/dev/null
fi
corepack enable >/dev/null 2>&1 || npm install -g corepack >/dev/null

if ! id pzsm >/dev/null 2>&1; then
  log "Creating user pzsm"
  useradd --system --create-home --home-dir /home/pzsm --shell /bin/bash pzsm
fi
install -d -o pzsm -g pzsm "$DATA_DIR" "$DATA_DIR/server" "$DATA_DIR/zomboid" "$DATA_DIR/manager" "$DATA_DIR/backups"

if [ ! -x "$STEAMCMD_DIR/steamcmd.sh" ]; then
  log "Installing SteamCMD"
  install -d -o pzsm -g pzsm "$STEAMCMD_DIR"
  curl -fsSL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar -xz -C "$STEAMCMD_DIR"
  chown -R pzsm:pzsm "$STEAMCMD_DIR"
  su - pzsm -c "$STEAMCMD_DIR/steamcmd.sh +quit" >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------- source
# Default: fetch from GitHub. PZSM_SRC=/path/to/checkout installs a local copy instead.
if [ -n "${PZSM_SRC:-}" ]; then
  [ -f "$PZSM_SRC/pnpm-workspace.yaml" ] || die "PZSM_SRC=$PZSM_SRC is not a PZ-SM checkout"
  SRC="$(cd "$PZSM_SRC" && pwd)"
  log "Using local source $SRC"
else
  SRC=/usr/local/src/pzsm
  log "Fetching $PZSM_REPO ($PZSM_REF)"
  if [ ! -d "$SRC/.git" ]; then
    rm -rf "$SRC"
    git init -q "$SRC"
    git -C "$SRC" remote add origin "$PZSM_REPO"
  else
    git -C "$SRC" remote set-url origin "$PZSM_REPO"
  fi
  git -C "$SRC" fetch -q --depth 1 origin "$PZSM_REF" || die "could not fetch '$PZSM_REF' from $PZSM_REPO"
  git -C "$SRC" checkout -q --force FETCH_HEAD
  log "Source at $(git -C "$SRC" rev-parse --short HEAD)"
fi

log "Building PZSM from $SRC"
BUILD=$(mktemp -d)
trap 'rm -rf "$BUILD"' EXIT
tar -C "$SRC" --exclude=node_modules --exclude=dist --exclude=.git --exclude=data -cf - . | tar -C "$BUILD" -xf -
(
  cd "$BUILD"
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1
  pnpm install --frozen-lockfile >/dev/null
  pnpm --filter @pzsm/pz-formats build >/dev/null
  pnpm --filter @pzsm/shared build >/dev/null
  pnpm --filter @pzsm/server build >/dev/null
  pnpm --filter @pzsm/web build >/dev/null
  rm -rf "$BUILD/out"
  pnpm --filter @pzsm/server deploy --prod "$BUILD/out" >/dev/null
  cp -r apps/web/dist "$BUILD/out/web"
)

log "Installing to $APP_DIR"
WAS_ACTIVE=0
if systemctl is-active --quiet pzsm 2>/dev/null; then
  WAS_ACTIVE=1
  log "Stopping running service (the game server saves and quits)"
  systemctl stop pzsm
fi
rm -rf "$APP_DIR.new"
mv "$BUILD/out" "$APP_DIR.new"
rm -rf "$APP_DIR.old"
[ -d "$APP_DIR" ] && mv "$APP_DIR" "$APP_DIR.old"
mv "$APP_DIR.new" "$APP_DIR"
rm -rf "$APP_DIR.old"
chown -R root:root "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  log "Writing $ENV_FILE"
  cat >"$ENV_FILE" <<EOF
# PZSM configuration (restart with: systemctl restart pzsm)
PZSM_DATA=$DATA_DIR
PZSM_WEB_DIR=$APP_DIR/web
STEAMCMD=$STEAMCMD_DIR/steamcmd.sh
HOST=0.0.0.0
PORT=${PZSM_PORT:-8080}
PZSM_ADMIN_PASSWORD=${PZSM_ADMIN_PASSWORD:-}
PZ_SERVER_NAME=${PZ_SERVER_NAME:-pzserver}
PZ_MAX_MEMORY=${PZ_MAX_MEMORY:-8g}
PZSM_AUTO_INSTALL=${PZSM_AUTO_INSTALL:-1}
TRUST_PROXY=0
PZSM_SECURE_COOKIES=0
LANG=en_US.UTF-8
EOF
  chmod 600 "$ENV_FILE"
fi

log "Installing systemd unit"
cat >"$SERVICE" <<EOF
[Unit]
Description=PZSM - Project Zomboid server manager
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pzsm
Group=pzsm
EnvironmentFile=$ENV_FILE
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/env node $APP_DIR/dist/index.js
# The manager saves the world and stops the game server on SIGTERM.
KillSignal=SIGTERM
KillMode=mixed
TimeoutStopSec=180
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=$DATA_DIR $STEAMCMD_DIR /home/pzsm /tmp

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now pzsm >/dev/null
if [ "$WAS_ACTIVE" = 1 ]; then log "Service restarted"; fi

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
log "Done. Panel: http://${IP:-<this-host>}:${PZSM_PORT:-8080}"
echo "    Game ports: UDP 16261-16262 (forward these on your router/firewall)."
echo "    Logs:       journalctl -u pzsm -f"
echo "    Config:     $ENV_FILE   Data: $DATA_DIR"
echo "    Upgrade:    re-run this installer (it fetches the latest $PZSM_REF)"
