#!/usr/bin/env bash
# Simulates `steamcmd +app_update` for tests. $FAKE_UPDATE_MODE:
#   ok             always succeeds
#   needs-validate fails with app state 0x6 unless "validate" is passed (the old build's
#                  manifest is no longer served and not cached)
#   needs-reset    additionally fails while the appmanifest file exists
#   fail           always fails
# Every invocation's arguments are appended to $FAKE_UPDATE_LOG.
set -u
echo "$*" >> "$FAKE_UPDATE_LOG"
dir=""
validate=0
prev=""
for a in "$@"; do
  [ "$prev" = "+force_install_dir" ] && dir="$a"
  [ "$a" = "validate" ] && validate=1
  prev="$a"
done
manifest="$dir/steamapps/appmanifest_380870.acf"
printf 'Loading Steam API...OK\nConnecting anonymously to Steam Public...OK\nWaiting for user info...OK\n'
ok=0
case "${FAKE_UPDATE_MODE:-ok}" in
  ok) ok=1 ;;
  needs-validate) [ "$validate" = 1 ] && ok=1 ;;
  needs-reset) [ "$validate" = 1 ] && [ ! -f "$manifest" ] && ok=1 ;;
esac
if [ "$ok" = 1 ]; then
  mkdir -p "$dir/steamapps"
  printf '"AppState"\n{\n\t"appid"\t\t"380870"\n\t"buildid"\t\t"26486687"\n}\n' > "$manifest"
  printf "Success! App '380870' fully installed.\n"
  exit 0
fi
printf "Error! App '380870' state is 0x6 after update job.\n"
exit 8
