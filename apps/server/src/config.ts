import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const env = process.env;

function path(name: string, fallback: string): string {
  return resolve(env[name] && env[name]!.trim() ? env[name]! : fallback);
}

const dataDir = path('PZSM_DATA', '/data');

/** Process-level configuration (paths, ports). Everything user-tunable lives in ManagerSettings. */
export const config = {
  dataDir,
  /** Dedicated server install (SteamCMD app 380870). */
  installDir: path('PZ_INSTALL_DIR', join(dataDir, 'server')),
  /** Zomboid cache dir passed as -cachedir (Server/, Saves/, db/, Logs/). */
  cacheDir: path('PZ_CACHE_DIR', join(dataDir, 'zomboid')),
  managerDir: path('PZSM_MANAGER_DIR', join(dataDir, 'manager')),
  backupDir: path('PZSM_BACKUP_DIR', join(dataDir, 'backups')),
  steamcmd: env.STEAMCMD ?? '/opt/steamcmd/steamcmd.sh',
  host: env.HOST ?? '0.0.0.0',
  port: Number(env.PORT ?? 8080),
  webDir: path('PZSM_WEB_DIR', fileURLToPath(new URL('../../web/dist', import.meta.url))),
  initialAdminPassword: env.PZSM_ADMIN_PASSWORD ?? '',
  trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
  secureCookies: env.PZSM_SECURE_COOKIES === '1' || env.PZSM_SECURE_COOKIES === 'true',
  /** Initial manager settings overrides (first boot only). */
  initial: {
    serverName: env.PZ_SERVER_NAME,
    branch: env.PZ_BRANCH,
    javaMaxMemory: env.PZ_MAX_MEMORY,
    gamePort: env.PZ_GAME_PORT ? Number(env.PZ_GAME_PORT) : undefined,
    udpPort: env.PZ_UDP_PORT ? Number(env.PZ_UDP_PORT) : undefined,
  },
  steamAppId: 380870,
  workshopAppId: 108600,
  /** Skip actually spawning SteamCMD/Java (UI development without a server). */
  dryRun: env.PZSM_DRY_RUN === '1',
};

export type Config = typeof config;
