#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
arena_node=node
if [ "$(uname -s)" = Linux ] && [ "$(uname -m)" = x86_64 ] && [ -f runtime/linux-x64/bin/node ]; then
  chmod +x runtime/linux-x64/bin/node
  arena_node=./runtime/linux-x64/bin/node
fi
exec "$arena_node" scripts/serve.mjs --open
