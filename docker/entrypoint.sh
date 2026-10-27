#!/usr/bin/env bash
# Adjust the runtime user to PUID/PGID, fix data ownership, then drop privileges.
set -euo pipefail

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

if [ "$(id -u)" = "0" ]; then
  if [ "$(id -g pzsm)" != "$PGID" ]; then groupmod -o -g "$PGID" pzsm; fi
  if [ "$(id -u pzsm)" != "$PUID" ]; then usermod -o -u "$PUID" pzsm; fi

  mkdir -p /data/server /data/zomboid /data/manager /data/backups
  # Only re-own when needed (the game install is large).
  for d in /data /data/server /data/zomboid /data/manager /data/backups /opt/steamcmd /home/pzsm; do
    if [ "$(stat -c %u "$d")" != "$PUID" ]; then chown -R pzsm:pzsm "$d"; fi
  done
  exec gosu pzsm "$@"
fi

exec "$@"
