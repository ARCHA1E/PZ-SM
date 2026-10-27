/**
 * Extract option/command definitions from projectzomboid.jar classes and the game's own
 * settings UI layout (media/lua/client/OptionScreens/ServerSettingsScreen.lua).
 */
import { enumConstants, type Annotation, type AnnotationValue, type CodeEvent, type JavaClass } from './javaClass.js';
import { parseTableAfter, toPlain } from './lua.js';

export type ServerOptionType = 'boolean' | 'integer' | 'double' | 'string' | 'text' | 'enum';

export interface ServerOptionDef {
  name: string;
  type: ServerOptionType;
  default: string | number | boolean;
  min?: number;
  max?: number;
  /** For string/text options; -1 = unlimited. */
  maxLength?: number;
  numValues?: number;
}

export interface SandboxOptionDef {
  /** Dotted name as stored in SandboxVars (`ZombieLore.Speed`). */
  name: string;
  type: 'boolean' | 'integer' | 'double' | 'string' | 'enum';
  default: string | number | boolean;
  min?: number;
  max?: number;
  numValues?: number;
  maxLength?: number;
  translation?: string;
  valueTranslation?: string;
  /** For strong enums: the Java enum class and its constant names. */
  enumClass?: string;
  enumValues?: string[];
}

function paramCount(desc: string): string[] {
  const m = /^\(([^)]*)\)/.exec(desc);
  if (!m) return [];
  const out: string[] = [];
  const s = m[1];
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    let t = c;
    while (c === '[') {
      c = s[++i];
      t += c;
    }
    if (c === 'L') {
      const e = s.indexOf(';', i);
      t += s.slice(i + 1, e + 1);
      i = e;
    }
    out.push(t);
  }
  return out;
}

const SERVER_OPTION_TYPES: Record<string, ServerOptionType> = {
  BooleanServerOption: 'boolean',
  IntegerServerOption: 'integer',
  DoubleServerOption: 'double',
  StringServerOption: 'string',
  TextServerOption: 'text',
  EnumServerOption: 'enum',
};

type Value = string | number;

/** Walk `new XServerOption(this, name, ...)` constructions in ServerOptions.<init>. */
export function extractServerOptions(cls: JavaClass): ServerOptionDef[] {
  const out: ServerOptionDef[] = [];
  for (const m of cls.methods) {
    if (!m.events) continue;
    const stack: { type: string; args: Value[] }[] = [];
    for (const e of m.events) {
      if (e.k === 'new') {
        stack.push({ type: e.type, args: [] });
      } else if (e.k === 'const') {
        stack[stack.length - 1]?.args.push(e.v);
      } else if (e.k === 'call' && e.desc === 'getstatic') {
        stack[stack.length - 1]?.args.push(`enum:${e.owner}.${e.name}`);
      } else if (e.k === 'call' && e.name === '<init>') {
        const top = stack[stack.length - 1];
        if (!top || top.type !== e.owner) continue;
        stack.pop();
        const short = e.owner.split('$').pop() ?? '';
        const type = SERVER_OPTION_TYPES[short];
        if (!type || !e.owner.startsWith('zombie/network/ServerOptions$')) continue;
        const params = paramCount(e.desc).slice(1); // drop outer `this`
        const args = top.args.slice(-params.length);
        const name = String(args[0]);
        const def: ServerOptionDef = { name, type, default: '' };
        if (type === 'boolean') def.default = args[1] === 1;
        else if (type === 'integer' || type === 'double') {
          def.min = Number(args[1]);
          def.max = Number(args[2]);
          def.default = Number(args[3]);
        } else if (type === 'enum') {
          def.numValues = Number(args[1]);
          def.min = 1;
          def.max = def.numValues;
          def.default = Number(args[2]);
        } else {
          def.default = String(args[1] ?? '');
          if (args[2] !== undefined) def.maxLength = Number(args[2]);
        }
        if (!out.some((o) => o.name === name)) out.push(def);
      }
    }
  }
  return out;
}

const SANDBOX_FACTORIES: Record<string, SandboxOptionDef['type']> = {
  newBooleanOption: 'boolean',
  newIntegerOption: 'integer',
  newDoubleOption: 'double',
  newStringOption: 'string',
  newEnumOption: 'enum',
};

/**
 * Walk `newXOption(name, ...)` + `.setTranslation(..)` chains in SandboxOptions and its
 * inner classes ($ZombieLore, $ZombieConfig, $Map, $Basement, $MultiplierConfig).
 */
export function extractSandboxOptions(classes: JavaClass[], loadEnum: (className: string) => string[] | undefined): SandboxOptionDef[] {
  const out: SandboxOptionDef[] = [];
  for (const cls of classes) {
    for (const m of cls.methods) {
      if (!m.events || (m.name !== '<init>' && !m.name.startsWith('init'))) continue;
      let buf: Value[] = [];
      let current: SandboxOptionDef | undefined;
      for (const e of m.events as CodeEvent[]) {
        if (e.k === 'const') {
          buf.push(e.v);
          continue;
        }
        if (e.k === 'call' && e.desc === 'getstatic') {
          buf.push(`enum:${e.owner}.${e.name}`);
          continue;
        }
        if (e.k !== 'call') continue;
        const factory = e.owner === 'zombie/SandboxOptions' ? SANDBOX_FACTORIES[e.name] : undefined;
        if (factory) {
          const params = paramCount(e.desc);
          const args = buf.slice(-params.length);
          const name = String(args[0]);
          const def: SandboxOptionDef = { name, type: factory, default: '' };
          if (factory === 'boolean') def.default = args[1] === 1;
          else if (factory === 'integer' || factory === 'double') {
            def.min = Number(args[1]);
            def.max = Number(args[2]);
            def.default = Number(args[3]);
          } else if (factory === 'string') {
            def.default = String(args[1] ?? '');
            if (args[2] !== undefined) def.maxLength = Number(args[2]);
          } else if (params[1] === 'Ljava/lang/Class;') {
            // Strong enum: (name, Class, Enum default)
            const clsName = String(args[1]).replace(/^class:/, '');
            const values = loadEnum(clsName) ?? [];
            const defName = String(args[2]).split('.').pop() ?? '';
            def.enumClass = clsName;
            def.enumValues = values;
            def.numValues = values.length;
            def.default = Math.max(1, values.indexOf(defName) + 1);
          } else {
            def.numValues = Number(args[1]);
            def.default = Number(args[2]);
          }
          if (def.type === 'enum') {
            def.min = 1;
            def.max = def.numValues;
          }
          if (!out.some((o) => o.name === name)) out.push(def);
          current = def;
          buf = [];
          continue;
        }
        if (current && (e.name === 'setTranslation' || e.name === 'setValueTranslation')) {
          const v = buf[buf.length - 1];
          if (typeof v === 'string') {
            if (e.name === 'setTranslation') current.translation = v;
            else current.valueTranslation = v;
          }
          buf = [];
          continue;
        }
        buf = [];
      }
    }
  }
  return out;
}

export interface CommandArgSet {
  required: string[];
  optional?: string;
  argName?: string;
}

export interface ServerCommandDef {
  className: string;
  names: string[];
  argSets: CommandArgSet[];
  helpKey?: string;
  capabilities: { capability: string; argName?: string }[];
}

const annType = (a: Annotation) => a.type.split('/').pop() ?? '';
const asArr = (v: AnnotationValue | undefined): AnnotationValue[] => (Array.isArray(v) ? v : v === undefined ? [] : [v]);

export function extractCommand(cls: JavaClass): ServerCommandDef | null {
  const def: ServerCommandDef = { className: cls.name, names: [], argSets: [], capabilities: [] };
  const handle = (a: Annotation) => {
    switch (annType(a)) {
      case 'CommandName':
        def.names.push(String(a.values.name));
        break;
      case 'CommandNames':
      case 'AltCommandArgs':
      case 'RequiredCapabilities':
        for (const x of asArr(a.values.value)) handle(x as Annotation);
        break;
      case 'CommandArgs':
        def.argSets.push({
          required: asArr(a.values.required).map(String),
          optional: a.values.optional !== undefined ? String(a.values.optional) : undefined,
          argName: a.values.argName !== undefined ? String(a.values.argName) : undefined,
        });
        break;
      case 'CommandHelp':
        def.helpKey = String(a.values.helpText);
        break;
      case 'RequiredCapability': {
        const cap = a.values.requiredCapability as { value: string } | undefined;
        if (cap) def.capabilities.push({ capability: cap.value, argName: a.values.argName !== undefined ? String(a.values.argName) : undefined });
        break;
      }
    }
  };
  cls.annotations.forEach(handle);
  return def.names.length ? def : null;
}

export function extractCapabilities(cls: JavaClass): string[] {
  return enumConstants(cls).filter((n) => n !== 'None');
}

export interface SettingsPage {
  name: string;
  /** Explicit title (mods' pages) */
  title?: string;
  settings: string[];
}

export interface SettingsLayout {
  ini: SettingsPage[];
  sandbox: SettingsPage[];
}

/** Parse `SettingsTable = { {name="INI", pages={...}}, {name="Sandbox", pages={...}} }`. */
export function parseSettingsLayout(luaText: string): SettingsLayout {
  type Page = { name: string; title?: string; settings?: unknown };
  type Cat = { name: string; pages?: unknown };
  // toPlain yields arrays for purely positional tables, objects for mixed ones.
  const list = <T>(v: unknown): T[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []) as T[];
  const t = list<Cat>(toPlain(parseTableAfter(luaText, /\bSettingsTable\s*=\s*\{/)));
  const conv = (c?: Cat): SettingsPage[] =>
    list<Page>(c?.pages)
      .filter((p) => p && typeof p === 'object' && typeof p.name === 'string')
      .map((p) => ({
        name: p.name,
        title: p.title,
        settings: list<{ name?: unknown }>(p.settings)
          .map((s) => (s && typeof s === 'object' ? s.name : undefined))
          .filter((n): n is string => typeof n === 'string'),
      }));
  return {
    ini: conv(t.find((c) => c?.name === 'INI')),
    sandbox: conv(t.find((c) => c?.name === 'Sandbox')),
  };
}
