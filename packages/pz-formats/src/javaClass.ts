/**
 * Minimal JVM class-file reader: constant pool, fields, methods, class annotations and
 * the ordered string/int constants loaded by each method's bytecode. Used to introspect
 * projectzomboid.jar (server commands, capabilities, option definitions) so the manager
 * adapts to new builds without hard-coded lists.
 */

export type AnnotationValue =
  | string
  | number
  | boolean
  | { enumType: string; value: string }
  | { classType: string }
  | AnnotationValue[]
  | Annotation;

export interface Annotation {
  type: string;
  values: Record<string, AnnotationValue>;
}

export interface JavaMember {
  name: string;
  descriptor: string;
  access: number;
  /** Ordered constants pushed by ldc/sipush/bipush/iconst in the method body. */
  constants?: (string | number)[];
  /** Ordered method invocations (owner.name) in the body. */
  invocations?: string[];
  /** For methods: sequence of (constant | invocation) events in bytecode order. */
  events?: CodeEvent[];
}

export type CodeEvent = { k: 'const'; v: string | number } | { k: 'call'; owner: string; name: string; desc: string } | { k: 'new'; type: string };

export interface JavaClass {
  name: string;
  superName?: string;
  access: number;
  fields: JavaMember[];
  methods: JavaMember[];
  annotations: Annotation[];
  /** All CONSTANT_String values. */
  strings: string[];
}

export const ACC_ENUM = 0x4000;
export const ACC_STATIC = 0x0008;

type CpEntry =
  | { tag: 1; value: string }
  | { tag: 3 | 4; value: number }
  | { tag: 5 | 6; value: number }
  | { tag: 7; nameIndex: number }
  | { tag: 8; stringIndex: number }
  | { tag: 9 | 10 | 11; classIndex: number; ntIndex: number }
  | { tag: 12; nameIndex: number; descIndex: number }
  | { tag: number; raw?: number };

export function parseClass(buf: Uint8Array, opts: { code?: boolean } = {}): JavaClass {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let p = 0;
  const u1 = () => dv.getUint8(p++);
  const u2 = () => {
    const v = dv.getUint16(p);
    p += 2;
    return v;
  };
  const u4 = () => {
    const v = dv.getUint32(p);
    p += 4;
    return v;
  };
  if (u4() !== 0xcafebabe) throw new Error('Not a class file');
  u2();
  u2();
  const cpCount = u2();
  const cp: CpEntry[] = new Array(cpCount);
  for (let i = 1; i < cpCount; i++) {
    const tag = u1();
    switch (tag) {
      case 1: {
        const len = u2();
        cp[i] = { tag: 1, value: decodeMutf8(buf.subarray(p, p + len)) };
        p += len;
        break;
      }
      case 3:
        cp[i] = { tag: 3, value: dv.getInt32(p) };
        p += 4;
        break;
      case 4:
        cp[i] = { tag: 4, value: dv.getFloat32(p) };
        p += 4;
        break;
      case 5:
        cp[i] = { tag: 5, value: Number(dv.getBigInt64(p)) };
        p += 8;
        i++;
        break;
      case 6:
        cp[i] = { tag: 6, value: dv.getFloat64(p) };
        p += 8;
        i++;
        break;
      case 7:
        cp[i] = { tag: 7, nameIndex: u2() };
        break;
      case 8:
        cp[i] = { tag: 8, stringIndex: u2() };
        break;
      case 9:
      case 10:
      case 11:
        cp[i] = { tag, classIndex: u2(), ntIndex: u2() } as CpEntry;
        break;
      case 12:
        cp[i] = { tag: 12, nameIndex: u2(), descIndex: u2() };
        break;
      case 15:
        p += 3;
        cp[i] = { tag };
        break;
      case 16:
      case 19:
      case 20:
        p += 2;
        cp[i] = { tag };
        break;
      case 17:
      case 18:
        p += 4;
        cp[i] = { tag };
        break;
      default:
        throw new Error(`Unknown constant pool tag ${tag} at ${p}`);
    }
  }
  const utf = (i: number): string => {
    const e = cp[i] as { tag: number; value?: unknown };
    return e && e.tag === 1 ? (e.value as string) : '';
  };
  const className = (i: number): string => (i ? utf((cp[i] as { nameIndex: number }).nameIndex) : '');
  const constValue = (i: number): string | number | undefined => {
    const e = cp[i] as CpEntry & { value?: number; stringIndex?: number };
    if (!e) return undefined;
    if (e.tag === 8) return utf(e.stringIndex!);
    if (e.tag === 3 || e.tag === 4 || e.tag === 5 || e.tag === 6) return e.value;
    if (e.tag === 7) return `class:${className(i)}`;
    return undefined;
  };
  const memberRef = (i: number) => {
    const e = cp[i] as { classIndex: number; ntIndex: number };
    const nt = cp[e.ntIndex] as { nameIndex: number; descIndex: number };
    return { owner: className(e.classIndex), name: utf(nt.nameIndex), desc: utf(nt.descIndex) };
  };

  const access = u2();
  const name = className(u2());
  const superName = className(u2()) || undefined;
  const ifaces = u2();
  p += ifaces * 2;

  const readElementValue = (): AnnotationValue => {
    const tag = String.fromCharCode(u1());
    switch (tag) {
      case 'B':
      case 'C':
      case 'I':
      case 'S':
      case 'D':
      case 'F':
      case 'J':
        return constValue(u2()) as number;
      case 'Z':
        return constValue(u2()) === 1;
      case 's':
        return utf(u2());
      case 'e': {
        const t = utf(u2());
        return { enumType: descToName(t), value: utf(u2()) };
      }
      case 'c':
        return { classType: utf(u2()) };
      case '@':
        return readAnnotation();
      case '[': {
        const n = u2();
        const arr: AnnotationValue[] = [];
        for (let i = 0; i < n; i++) arr.push(readElementValue());
        return arr;
      }
      default:
        throw new Error(`Unknown annotation element tag ${tag}`);
    }
  };
  const readAnnotation = (): Annotation => {
    const type = descToName(utf(u2()));
    const n = u2();
    const values: Record<string, AnnotationValue> = {};
    for (let i = 0; i < n; i++) {
      const k = utf(u2());
      values[k] = readElementValue();
    }
    return { type, values };
  };

  const readAttributes = (member?: JavaMember): Annotation[] => {
    const anns: Annotation[] = [];
    const count = u2();
    for (let a = 0; a < count; a++) {
      const an = utf(u2());
      const len = u4();
      const end = p + len;
      if (an === 'RuntimeVisibleAnnotations' || an === 'RuntimeInvisibleAnnotations') {
        const n = u2();
        for (let i = 0; i < n; i++) anns.push(readAnnotation());
      } else if (an === 'Code' && member && opts.code) {
        p += 4; // max_stack, max_locals
        const codeLen = u4();
        const code = buf.subarray(p, p + codeLen);
        Object.assign(member, scanCode(code, constValue, memberRef, className));
      }
      p = end;
    }
    return anns;
  };

  const readMembers = (): JavaMember[] => {
    const n = u2();
    const out: JavaMember[] = [];
    for (let i = 0; i < n; i++) {
      const m: JavaMember = { access: u2(), name: utf(u2()), descriptor: utf(u2()) };
      readAttributes(m);
      out.push(m);
    }
    return out;
  };

  const fields = readMembers();
  const methods = readMembers();
  const annotations = readAttributes();
  const strings: string[] = [];
  for (const e of cp) if (e && e.tag === 8) strings.push(utf((e as { stringIndex: number }).stringIndex));
  return { name, superName, access, fields, methods, annotations, strings };
}

function descToName(desc: string): string {
  return desc.startsWith('L') && desc.endsWith(';') ? desc.slice(1, -1) : desc;
}

/** Opcode operand sizes for straightforward instructions (excluding switches/wide). */
const OPERANDS: Record<number, number> = {
  0x10: 1, 0x11: 2, 0x12: 1, 0x13: 2, 0x14: 2, 0x15: 1, 0x16: 1, 0x17: 1, 0x18: 1, 0x19: 1,
  0x36: 1, 0x37: 1, 0x38: 1, 0x39: 1, 0x3a: 1, 0x84: 2, 0xa9: 1,
  0x99: 2, 0x9a: 2, 0x9b: 2, 0x9c: 2, 0x9d: 2, 0x9e: 2, 0x9f: 2, 0xa0: 2, 0xa1: 2, 0xa2: 2, 0xa3: 2, 0xa4: 2, 0xa5: 2, 0xa6: 2, 0xa7: 2, 0xa8: 2,
  0xb2: 2, 0xb3: 2, 0xb4: 2, 0xb5: 2, 0xb6: 2, 0xb7: 2, 0xb8: 2, 0xb9: 4, 0xba: 4, 0xbb: 2, 0xbc: 1, 0xbd: 2, 0xc0: 2, 0xc1: 2, 0xc5: 3, 0xc6: 2, 0xc7: 2, 0xc8: 4, 0xc9: 4,
};

function scanCode(
  code: Uint8Array,
  constValue: (i: number) => string | number | undefined,
  memberRef: (i: number) => { owner: string; name: string; desc: string },
  className: (i: number) => string,
): Pick<JavaMember, 'constants' | 'invocations' | 'events'> {
  const constants: (string | number)[] = [];
  const invocations: string[] = [];
  const events: CodeEvent[] = [];
  const dv = new DataView(code.buffer, code.byteOffset, code.byteLength);
  const pushConst = (v: string | number | undefined) => {
    if (v === undefined) return;
    constants.push(v);
    events.push({ k: 'const', v });
  };
  let i = 0;
  while (i < code.length) {
    const op = code[i];
    if (op >= 0x02 && op <= 0x08) pushConst(op - 0x03); // iconst_m1..iconst_5
    else if (op === 0x0b || op === 0x0c || op === 0x0d) pushConst(op - 0x0b); // fconst
    else if (op === 0x0e || op === 0x0f) pushConst(op - 0x0e); // dconst
    else if (op === 0x10) pushConst(dv.getInt8(i + 1));
    else if (op === 0x11) pushConst(dv.getInt16(i + 1));
    else if (op === 0x12) pushConst(constValue(code[i + 1]));
    else if (op === 0x13 || op === 0x14) pushConst(constValue(dv.getUint16(i + 1)));
    else if (op === 0xb6 || op === 0xb7 || op === 0xb8 || op === 0xb9) {
      const r = memberRef(dv.getUint16(i + 1));
      invocations.push(`${r.owner}.${r.name}`);
      events.push({ k: 'call', owner: r.owner, name: r.name, desc: r.desc });
    } else if (op === 0xb2) {
      const r = memberRef(dv.getUint16(i + 1));
      // getstatic of an enum constant: record as a const-like event for pattern matching.
      events.push({ k: 'call', owner: r.owner, name: r.name, desc: 'getstatic' });
    } else if (op === 0xbb) {
      events.push({ k: 'new', type: className(dv.getUint16(i + 1)) });
    }

    if (op === 0xaa) {
      // tableswitch
      let j = i + 1;
      j += (4 - (j % 4)) % 4;
      const low = dv.getInt32(j + 4);
      const high = dv.getInt32(j + 8);
      i = j + 12 + (high - low + 1) * 4;
      continue;
    }
    if (op === 0xab) {
      // lookupswitch
      let j = i + 1;
      j += (4 - (j % 4)) % 4;
      const npairs = dv.getInt32(j + 4);
      i = j + 8 + npairs * 8;
      continue;
    }
    if (op === 0xc4) {
      // wide
      i += code[i + 1] === 0x84 ? 6 : 4;
      continue;
    }
    i += 1 + (OPERANDS[op] ?? 0);
  }
  return { constants, invocations, events };
}

function decodeMutf8(b: Uint8Array): string {
  let out = '';
  for (let i = 0; i < b.length; ) {
    const c = b[i++];
    if (c < 0x80) out += String.fromCharCode(c);
    else if ((c & 0xe0) === 0xc0) out += String.fromCharCode(((c & 0x1f) << 6) | (b[i++] & 0x3f));
    else out += String.fromCharCode(((c & 0x0f) << 12) | ((b[i++] & 0x3f) << 6) | (b[i++] & 0x3f));
  }
  return out;
}

/** Names of enum constants declared by an enum class. */
export function enumConstants(cls: JavaClass): string[] {
  const flagged = cls.fields.filter((f) => (f.access & ACC_ENUM) !== 0).map((f) => f.name);
  if (flagged.length) return flagged;
  // Obfuscated/compiled without the ENUM flag: static fields of the enum's own type.
  const self = `L${cls.name};`;
  return cls.fields.filter((f) => (f.access & ACC_STATIC) !== 0 && f.descriptor === self).map((f) => f.name);
}
