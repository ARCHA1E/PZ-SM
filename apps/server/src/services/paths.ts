import { join } from 'node:path';
import { config } from '../config.js';
import { getSettings } from '../db.js';

/** Paths for the managed server (derived from the current server name). */
export function serverPaths(name = getSettings().serverName) {
  const c = config.cacheDir;
  return {
    name,
    ini: join(c, 'Server', `${name}.ini`),
    sandbox: join(c, 'Server', `${name}_SandboxVars.lua`),
    spawnregions: join(c, 'Server', `${name}_spawnregions.lua`),
    spawnpoints: join(c, 'Server', `${name}_spawnpoints.lua`),
    serverDir: join(c, 'Server'),
    gameDb: join(c, 'db', `${name}.db`),
    save: join(c, 'Saves', 'Multiplayer', name),
    savePlayer: join(c, 'Saves', 'Multiplayer', `${name}_player`),
    logs: join(c, 'Logs'),
    consoleTxt: join(c, 'server-console.txt'),
    presets: join(c, 'Sandbox Presets'),
  };
}

export function installPaths() {
  const i = config.installDir;
  return {
    root: i,
    jar: join(i, 'projectzomboid.jar'),
    javaDir: join(i, 'java'),
    media: join(i, 'media'),
    maps: join(i, 'media', 'maps'),
    translateEN: join(i, 'media', 'lua', 'shared', 'Translate', 'EN'),
    settingsScreen: join(i, 'media', 'lua', 'client', 'OptionScreens', 'ServerSettingsScreen.lua'),
    presetsLua: join(i, 'media', 'lua', 'shared', 'Sandbox'),
    appManifest: join(i, 'steamapps', `appmanifest_${config.steamAppId}.acf`),
    workshopContent: join(i, 'steamapps', 'workshop', 'content', String(config.workshopAppId)),
    workshopAcf: join(i, 'steamapps', 'workshop', `appworkshop_${config.workshopAppId}.acf`),
    launchJson: join(i, 'ProjectZomboid64.json'),
    startScript: join(i, 'start-server.sh'),
  };
}
