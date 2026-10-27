/** Types shared by the PZSM API server and web panel. */

export type OptionValue = string | number | boolean;

export type SettingType = 'boolean' | 'integer' | 'double' | 'string' | 'text' | 'enum';

/** Where a setting definition came from. */
export type SettingSource = 'build' | 'file-comment' | 'mod' | 'unknown';

export interface SettingDef {
  /** ini key, or dotted SandboxVars path (`ZombieLore.Speed`). */
  key: string;
  type: SettingType;
  label: string;
  description?: string;
  default?: OptionValue;
  min?: number;
  max?: number;
  maxLength?: number;
  choices?: { value: number; label: string }[];
  /** Page / group key. */
  page: string;
  source: SettingSource;
  /** Mod ids providing this option (sandbox mod options). */
  mods?: string[];
  secret?: boolean;
  /** Can be applied to a running server via `changeoption` (ini only). */
  live?: boolean;
  /** Managed on a dedicated page (Mods, Map, WorkshopItems, ports...). */
  managed?: boolean;
}

export interface SettingsPageDef {
  key: string;
  title: string;
  /** For sandbox mod pages */
  mod?: string;
}

export interface SettingsView {
  kind: 'server' | 'sandbox';
  pages: SettingsPageDef[];
  settings: SettingDef[];
  values: Record<string, OptionValue | null>;
  /** Keys in the file that no schema describes (still editable as raw text). */
  unknownKeys: string[];
  fileExists: boolean;
}

export interface SettingsChange {
  values: Record<string, OptionValue>;
}

export interface SettingsApplyResult {
  written: string[];
  appliedLive: string[];
  restartRequired: string[];
  errors: Record<string, string>;
}

export type ServerState = 'not-installed' | 'installing' | 'stopped' | 'starting' | 'running' | 'stopping' | 'updating' | 'crashed';

export interface ServerStatus {
  state: ServerState;
  serverName: string;
  pid?: number;
  startedAt?: string;
  uptimeSec?: number;
  buildVersion?: string;
  buildId?: string;
  branch: string;
  installed: boolean;
  rconConnected: boolean;
  players: OnlinePlayer[];
  cpu?: number;
  memRss?: number;
  pendingRestart: boolean;
  pendingRoleChanges: number;
  updateAvailable?: boolean;
  modUpdatesAvailable?: number;
  lastExitCode?: number | null;
  task?: TaskInfo | null;
}

export interface TaskInfo {
  id: string;
  kind: string;
  label: string;
  startedAt: string;
  progress?: number;
  message?: string;
}

export interface OnlinePlayer {
  username: string;
}

export interface ConsoleLine {
  t: number;
  stream: 'out' | 'err' | 'sys';
  text: string;
}

export interface ModEntry {
  id: string;
  name: string;
  workshopId?: string;
  folder: string;
  versionDir?: string;
  enabled: boolean;
  description?: string;
  author?: string;
  require: string[];
  incompatible: string[];
  loadModAfter: string[];
  loadModBefore: string[];
  versionMin?: string;
  versionMax?: string;
  hasSandboxOptions: boolean;
  maps: string[];
  poster?: string;
  problems: string[];
}

export interface WorkshopItem {
  workshopId: string;
  title?: string;
  preview?: string;
  timeUpdated?: number;
  localUpdated?: number;
  installed: boolean;
  needsUpdate?: boolean;
  modIds: string[];
  size?: number;
  /** Listed in the server's WorkshopItems= */
  inServerConfig: boolean;
}

export interface ModsView {
  mods: ModEntry[];
  workshop: WorkshopItem[];
  /** Current Mods= order */
  activeOrder: string[];
  suggestedOrder: string[];
  problems: string[];
  gameVersion?: string;
}

export interface MapEntry {
  folder: string;
  title: string;
  description?: string;
  lots: string[];
  source: 'vanilla' | 'mod';
  mod?: string;
  hasSpawnpoints: boolean;
  spawnpointsFile?: string;
  thumb?: boolean;
}

export interface SpawnRegionView {
  name: string;
  file?: string;
  serverfile?: string;
  valid: boolean;
  problem?: string;
}

export interface RoleView {
  id: number;
  name: string;
  description: string;
  color: [number, number, number];
  readonly: boolean;
  position: number;
  capabilities: string[];
}

export interface WhitelistUser {
  id: number;
  username: string;
  role: number;
  roleName?: string;
  steamid?: string;
  displayName?: string;
  lastConnection?: string;
  online?: boolean;
}

export interface BanEntry {
  kind: 'steamid' | 'ip';
  value: string;
  username?: string;
  reason?: string;
}

export interface PermissionsView {
  available: boolean;
  reason?: string;
  roles: RoleView[];
  capabilities: string[];
  defaultRoles: Record<string, number>;
  users: WhitelistUser[];
  bans: BanEntry[];
  pending: PendingChange[];
}

export interface PendingChange {
  id: number;
  createdAt: string;
  description: string;
  op: unknown;
}

export interface CommandDef {
  names: string[];
  argSets: { required: string[]; optional?: string; argName?: string }[];
  help?: string;
  capabilities: string[];
}

export interface BackupEntry {
  id: string;
  file: string;
  createdAt: string;
  size: number;
  kind: 'manual' | 'scheduled' | 'pre-restore' | 'pre-wipe' | 'pre-update' | 'import';
  note?: string;
}

export interface ScheduleEntry {
  id: number;
  kind: 'restart' | 'backup' | 'mod-update-check' | 'game-update-check' | 'message' | 'command';
  cron: string;
  enabled: boolean;
  payload: Record<string, unknown>;
  lastRun?: string;
  nextRun?: string;
}

export interface ManagerSettings {
  serverName: string;
  branch: string;
  branchPassword: string;
  javaMaxMemory: string;
  javaMinMemory: string;
  extraJvmArgs: string;
  extraServerArgs: string;
  bindIp: string;
  autoStart: boolean;
  restartOnCrash: boolean;
  updateOnStart: boolean;
  validateOnUpdate: boolean;
  backupRetention: number;
  restartWarningMinutes: number[];
  restartWarningMessage: string;
  modUpdateAction: 'notify' | 'restart';
  steamApiKey: string;
  adminUsername: string;
}

export interface BuildManifestSummary {
  key: string;
  version?: string;
  buildId?: string;
  createdAt: string;
  serverOptions: number;
  sandboxOptions: number;
  commands: number;
  capabilities: number;
  maps: number;
  diff?: { added: string[]; removed: string[]; changedDefaults: string[] };
}

export interface LogFileEntry {
  path: string;
  name: string;
  type: string;
  date?: string;
  size: number;
  archive?: string;
}

export interface AuditEntry {
  id: number;
  at: string;
  action: string;
  detail: string;
}

export interface MetricPoint {
  t: number;
  cpu?: number;
  rss?: number;
  players?: number;
}

export type WsMessage =
  | { type: 'console'; lines: ConsoleLine[] }
  | { type: 'status'; status: ServerStatus }
  | { type: 'task'; task: TaskInfo | null; line?: string };
