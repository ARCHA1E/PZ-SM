#!/usr/bin/env bash
# Adjust the runtime user to PUID/PGID, fix data ownership, then drop privileges.
set -euo pipefail

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

if [ "$(id -u)" = "0" ]; then
  if [ "$(id -g pzsm)" != "$PGID" ]; then groupmod -o -g "$PGID" pzsm; fi
  if [ "$(id -u pzsm)" != "$PUID" ]; then usermod -o -u "$PUID" pzsm; fi

  mkdir -p /data/server /data/zomboid /data/manager /data/backups /data/steam

  # Keep SteamCMD's own state (depot manifests, app info) on the data volume. Without the
  # manifests of the installed build, the next game update cannot be applied as a delta
  # after the container has been recreated.
  if [ ! -L /home/pzsm/Steam ]; then
    if [ -d /home/pzsm/Steam ]; then
      cp -an /home/pzsm/Steam/. /data/steam/ 2>/dev/null || true
      rm -rf /home/pzsm/Steam
    fi
    ln -s /data/steam /home/pzsm/Steam
  fi

  # Only re-own when needed (the game install is large).
  for d in /data /data/server /data/zomboid /data/manager /data/backups /data/steam /opt/steamcmd /home/pzsm; do
    if [ "$(stat -c %u "$d")" != "$PUID" ]; then chown -R pzsm:pzsm "$d"; fi
  done
  exec gosu pzsm "$@"
fi

exec "$@"
