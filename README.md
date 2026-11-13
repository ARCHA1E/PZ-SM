# PZ-SM: Project Zomboid Server Manager (Build 42)

A self-hosted manager and web panel for one **Project Zomboid Build 42 dedicated server** (tested on 42.21 and 42.22.2, Steam build 26486687). It runs as a single Docker container, or natively in a Proxmox LXC.

PZSM learns the server's capabilities from the installed game itself, so new builds and mods need no code changes:

| What | Read from |
| --- | --- |
| Server options (144 in 42.21): type, range, default | `projectzomboid.jar` → `ServerOptions` constructors |
| Sandbox options (269): type, range, default, translation keys | `SandboxOptions` + inner classes; defaults from the preset `SandboxVars.lua` requires |
| Admin commands (67): names, aliases, arguments, required capability | `zombie/commands/serverCommands/*` annotations |
| Capabilities (97) and roles | `Capability` enum + the server's SQLite db |
| Page layout and labels | the game's own `ServerSettingsScreen.lua`, `Translate/EN/*.json` |
| Mod sandbox options | each enabled mod's `sandbox-options.txt` + its translations |
| Maps | `media/maps/*/map.info` (game + mods) |

The panel never hides anything. Keys found in your files that no schema describes are still shown and editable as "unrecognized" (for example, options of a mod that is no longer enabled).

## Features

- **Web panel**: top navigation, navy and burnt-orange dark/light themes, and hover tooltips on every setting (description, default, range, and whether it applies live or on restart).
- **Dashboard**: start/stop/restart (with in-game countdown), crash auto-restart, CPU, RAM and player history, update notices.
- **Console**: live output over WebSocket, and commands over RCON with autocomplete from the build's command list.
- **Server Settings / Sandbox**: typed forms grouped like the in-game UI, plus one page per mod. Also: search, "changed from default" filter, reset to default, and live vs restart badges.
  - While the server runs, ini changes go through `changeoption`, so they are applied immediately where possible and never overwritten by the server.
  - Sandbox presets: apply the game presets or `.cfg` files, upload, and export.
- **Mods**:
  - **Browse the Steam Workshop** from the panel: search, sort (popular, top rated, newest, recently updated), mods or collections, and tag filters you can require or exclude (Build 42 is required by default). Item pages show the description, stats and "Required items". No Steam API key is needed; if you set one on the Manager page, the official API is used instead. Steam rate-limits its community pages per IP (item pages after roughly 20 quick requests), so PZ-SM spaces those requests out, reads requirements in the background slowly, and pauses for a few minutes after a 403/429 instead of retrying.
  - **Install with dependencies**: pick items, collections or paste IDs/URLs; PZ-SM expands collections, follows "Required items" transitively, shows the full list for review, then downloads everything and enables the mods in dependency order. Items with several mods (often variants) are left for you to pick.
  - Installed list grouped by Workshop item, with filters for status (enabled, problems, updates, not downloaded, needs a choice), author, tags and content (sandbox options, maps), and a **configure** link straight to each mod's sandbox options.
  - **Remove all mods** while keeping every vanilla setting (clears `Mods=`/`WorkshopItems=`, drops mod sections from SandboxVars, keeps only vanilla maps and spawn regions), or **reset mod sandbox options** to their defaults. A backup is taken first; deleting downloaded files is optional.
  - Enable mods with automatic dependencies, and auto-sort the load order from `require` / `loadModAfter` / `loadModBefore`.
  - B42 version-folder resolution (`42/`, `42.13/`, `common/`) and problem detection: missing deps, B41-only mods, incompatibilities, version ranges.
  - Downloads survive flaky Steam connections. When SteamCMD loses its connection (every remaining item fails with "No Connection"), the session is killed and a new one continues from the first missing item, with backoff. Items already up to date are skipped, and an interrupted download resumes after a restart or from the Mods page.
  - Update checks against the Steam API, with an optional automatic restart.
- **Maps & Spawns**:
  - `Map=` ordering from the game and mod maps catalog.
  - Spawn region editor that validates file paths, plus a "generate from active maps" button.
  - Custom spawn points.
  - World operations: soft reset, new worldgen, wipe, each with an automatic backup.
- **Players**: online and known players, character position, kick/ban, give items or XP, god mode, invisibility, vehicles, teleport.
- **Roles & Access**:
  - B42 roles with a capability matrix: create and edit custom roles, and set default roles.
  - Whitelist accounts and bans (Steam ID / IP).
  - Role edits made while the server runs are queued and applied before the next start, because the game caches roles in memory.
- **Logs**: browse every log type, including archived sessions, with search.
- **Import from the game**: upload the `.ini`, `SandboxVars.lua` and spawn files of a server you set up in Project Zomboid. Review them, then install them here with the Workshop mods downloaded automatically.
- **Backups**: manual or scheduled `.tar.gz` of the save, player save, config and db, with retention, restore and download. You can also **import an existing server** from a `.zip`/`.tar.gz` of a Zomboid folder.
- **Schedules**: restarts, backups, mod/game update checks, broadcast messages and arbitrary commands (cron syntax).
- **Manager**: Steam branch, JVM heap and arguments, auto-start/update, in-game admin credentials, build analysis with diff after updates, and an audit log.

## Quick start (Docker Compose)

```bash
git clone https://github.com/ARCHA1E/PZ-SM.git && cd PZ-SM
cp .env.example .env        # set PZSM_ADMIN_PASSWORD (or create it in the browser)
docker compose up -d --build
```

Open `http://<host>:8080`. On first start PZSM installs the dedicated server with SteamCMD (about 7 GB, app 380870, anonymous), analyzes it, creates the world and starts it. The generated in-game admin password is shown on the **Manager** page.

| Port | Proto | Purpose |
| --- | --- | --- |
| 16261 | UDP | Game (Steam) |
| 16262 | UDP | Game (RakNet direct) |
| 8080 | TCP | Web panel (put it behind HTTPS if exposed) |

RCON is bound to `127.0.0.1` inside the container with a generated password. It is never published.

All state lives in one host directory (`PZSM_DATA_DIR`, default `./data`):

```
data/server    game install + workshop downloads
data/zomboid   Zomboid cachedir: Server/<name>.ini, Saves/, db/, Logs/
data/manager   PZSM database (settings, schedules, audit, metrics)
data/backups   backup archives
data/steam     SteamCMD state (lets game updates apply as small deltas)
```

### Memory

B42 needs RAM. Give the Java heap (`PZ_MAX_MEMORY`, or Manager → Java max heap) what you can afford, and leave about 3 GB extra for native memory:

| Players | Heap | Container / LXC RAM |
| --- | --- | --- |
| 2–4 | 6g | 9–10 GB |
| 5–10 | 8g | 11–12 GB |
| 11–20 | 12g | 15–16 GB |

Heavily modded servers need more.

## Proxmox

**VM**: install Docker in any Linux VM and use Docker Compose as above.

**LXC with Docker**: works in a privileged or unprivileged container with `features: nesting=1,keyctl=1`.

**Native LXC (no Docker)**: run this in the Proxmox host shell. Nothing needs to be cloned first:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/ARCHA1E/PZ-SM/main/install/pve-create-lxc.sh)"
```

The script asks which container ID to use; it never picks one automatically. It suggests the next free ID and refuses IDs that are already taken by a container or VM anywhere in the cluster. You can also pass it up front: `CTID=250 bash -c "$(curl …)"`, which is required when running without a terminal.

Set `CT_MEMORY`, `CT_CORES`, `CT_DISK`, `CT_IP`, `PZSM_ADMIN_PASSWORD` and so on as environment variables in front of it to override the defaults. For example: `CTID=250 CT_MEMORY=16384 CT_IP=192.168.1.50/24 CT_GW=192.168.1.1 bash -c "$(curl …)"`.

This creates a Debian 12 container (4 cores, 12 GB RAM, 40 GB disk by default) and runs `install/lxc-install.sh` inside it. That script downloads PZ-SM from this GitHub repository, then:

- installs Node 22 and SteamCMD;
- builds PZ-SM into `/opt/pzsm` with its data in `/var/lib/pzsm`;
- writes `/etc/pzsm.env` and enables `pzsm.service`.

To install into an existing Debian/Ubuntu LXC or VM, run this as root inside it:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/ARCHA1E/PZ-SM/main/install/lxc-install.sh)"
```

Run the same command again to upgrade to the latest version. Your data and `/etc/pzsm.env` are kept. To install a fork, branch or tag, set `PZSM_REPO=https://github.com/<you>/<fork>.git` and/or `PZSM_REF=<branch|tag>`. To install from a local checkout (development), set `PZSM_SRC=/path/to/checkout`.

```bash
journalctl -u pzsm -f      # logs
systemctl restart pzsm     # restart (the game server saves and quits first)
```

## Setting up a server from a config made in the game

You can set a server up in Project Zomboid's own Host / server settings screens, with mods, sandbox, map and spawns, and then use that exact config on a PZ-SM server:

1. On Windows, open `%USERPROFILE%\Zomboid\Server\`. Find the four files for that server, for example `sophie-server-42-2.ini`, `sophie-server-42-2_SandboxVars.lua`, `sophie-server-42-2_spawnregions.lua` and `sophie-server-42-2_spawnpoints.lua`.
2. In the panel, go to **Server Settings → Import from game**. It is also on the Sandbox and Backups pages. Drop the files in, or a `.zip` containing them.
3. Review what was found: the files, mod and Workshop item counts, maps, sandbox options and spawn regions, plus warnings such as Build 41 keys or options this build doesn't know.
4. Choose your options:
   - **Keep this server's ports** (on by default, so the game ports keep matching Docker/LXC).
   - **Download the Workshop mods now**.
   - **Start a fresh world** (off by default; accounts and roles are kept).
   - **Start the server when done**.
5. Click **Import**.

What the import does:

- If the server is running, PZ-SM stops it (and starts it again afterwards). It also backs up the current config and world.
- The files are renamed to this server's name, and references to `<old name>_spawnpoints.lua` are updated.
- Everything except ports and RCON is installed byte for byte.
- If you chose to, it downloads every `WorkshopItems=` entry with SteamCMD and fills in defaults for any mod sandbox options missing from the file.

## Moving a whole server (with its world) in

Zip the server's files from `%USERPROFILE%\Zomboid`, keeping the folder structure: `Server\<name>.ini`, `Server\<name>_SandboxVars.lua`, `Server\<name>_spawn*.lua`, `Saves\Multiplayer\<name>` (and `<name>_player`), and `db\<name>.db`. Then in the panel:

1. Stop the server.
2. Go to **Backups → Import**.
3. Upload the zip. It is renamed to the PZSM server name, and a backup of the current world is taken first.
4. Go to **Mods → Update all**. PZSM reads `WorkshopItems=` and fetches everything.
5. Start the server.

## Game updates and versions

Players can only join when their game is on the same version as the server, and Steam updates clients automatically. When a new build is released:

1. Check that your mods support it. A build can break mods; the Mods page flags version ranges that no longer match.
2. In the panel, click **Update now** on the Dashboard or Manager page. PZ-SM stops the server, backs up the config and world, updates through SteamCMD, re-analyzes the build and starts the server again. If the update fails, the server is started again on the build that is installed.

To stay on an older version for a while, pick its branch under **Manager → Steam branch** and click **Update now**. The list comes from Steam, for example `public` (stable), `pre-release` and `42.21`. Your players then have to select the same branch in Steam (game → Properties → Game Versions & Betas).

A world that has been opened by a newer build cannot be loaded by an older one. The game refuses it, and the panel says so. To go back, switch the branch and restore the `pre-update` backup from the Backups page.

How the update itself is made reliable:

- SteamCMD normally applies a small delta, which needs its record of the build that is installed. If Steam refuses that (app state `0x6`, "Access Denied" in SteamCMD's log), PZ-SM retries with file validation, and as a last resort resets the install record and verifies every file.
- In Docker, SteamCMD's own state is kept in `data/steam`, so it survives recreating the container.

## How settings stay correct

- `.ini` and `SandboxVars.lua` edits are surgical. Only the changed lines or values are rewritten, and comments, order and unknown keys are preserved byte for byte. A `.pzsm.bak` copy is kept, and writes are atomic.
- A running server rewrites its ini from memory, so PZSM routes ini changes through `changeoption`. If the server is starting, PZSM waits until it is up. Only when the server is stopped does it edit the file directly.
- Sandbox changes are written to the file and take effect on restart. Newly enabled mods get their default values written in.
- After every game update the build is re-analyzed, and the Manager page shows which options were added or removed, or changed default.

## Development

You need Node 22 and pnpm (via corepack). Without a local Node, `scripts/dev.sh <cmd>` runs a command in a Node 22 container.

```bash
pnpm install
pnpm --filter @pzsm/pz-formats test       # parser tests (real B41/B42 config fixtures)
PZSM_DATA=./dev-data pnpm dev:server      # API on :8080 (PZSM_DRY_RUN=1 to skip SteamCMD/Java)
pnpm dev:web                              # panel on :5173 with API proxy
```

Layout:

```
packages/pz-formats  parsers/writers: ini, Lua tables (SandboxVars, spawn files), sandbox-options.txt,
                     mod.info/map.info, translations, presets, logs, VDF, JVM class files, build introspection
packages/shared      API types
apps/server          Fastify API + WebSocket, supervisor, SteamCMD, RCON, services
apps/web             React + Vite + Tailwind panel
docker/              Dockerfile, entrypoint
install/             native LXC installer, Proxmox helper
```

## Security notes

- There is one admin account for the panel. The password is stored as an scrypt hash, sessions use httpOnly SameSite=Strict cookies, and login attempts are rate-limited.
- If you expose the panel, put it behind an HTTPS reverse proxy and set `TRUST_PROXY=1` and `PZSM_SECURE_COOKIES=1`.
- Secrets (`Password`, `RCONPassword`, `DiscordToken`, `WebhookAddress`) are masked in the UI and the audit log.

## License and contributions

PZ-SM is released under the [MIT license](LICENSE). Fork it and adapt it as you like.
This repository doesn't accept pull requests or other outside contributions (see [CONTRIBUTING.md](CONTRIBUTING.md)).
