#!/usr/bin/env bash
# Simulates SteamCMD Workshop downloads for tests. Behaviour per session is read from
# $FAKE_STEAM_PLAN (one line per session): "ok" | "drop:<n>" (n successes, then the
# connection dies and every later item fails instantly) | "loginfail" | "hang".
# Downloaded ids are appended to $FAKE_STEAM_LOG, sessions counted in $FAKE_STEAM_STATE.
set -u
n=$(( $(cat "$FAKE_STEAM_STATE" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$FAKE_STEAM_STATE"
plan=$(sed -n "${n}p" "$FAKE_STEAM_PLAN")
plan=${plan:-ok}
ids=()
while [ $# -gt 0 ]; do
  if [ "$1" = "+workshop_download_item" ]; then ids+=("$3"); shift 3; else shift; fi
done
printf 'Redirecting stderr to ...\nLoading Steam API...OK\n'
if [ "$plan" = loginfail ]; then
  printf 'Connecting anonymously to Steam Public...FAILED (No Connection)\n'
  exit 5
fi
printf 'Connecting anonymously to Steam Public...OK\nWaiting for client config...OK\nWaiting for user info...OK\n'
if [ "$plan" = hang ]; then
  sleep 30
  exit 0
fi
okleft=999999
case "$plan" in drop:*) okleft=${plan#drop:} ;; esac
for id in "${ids[@]}"; do
  printf 'Downloading item %s ...' "$id"
  if [ "$okleft" -gt 0 ]; then
    okleft=$((okleft - 1))
    echo "$id" >> "$FAKE_STEAM_LOG"
    printf '\nSuccess. Downloaded item %s to "/data/server/steamapps/workshop/content/108600/%s" (%s bytes) ' "$id" "$id" "$((RANDOM * 100))"
  else
    printf '\nERROR%s Download item %s failed (No Connection).' '!' "$id"
  fi
done
printf 'Unloading Steam API...OK\n'
