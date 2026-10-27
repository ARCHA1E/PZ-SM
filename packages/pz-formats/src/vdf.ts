/** Valve KeyValues text (appmanifest_*.acf, appworkshop_*.acf, libraryfolders.vdf). */

export type VdfObject = { [key: string]: string | VdfObject };

export function parseVdf(text: string): VdfObject {
  let i = 0;
  const s = text;
  const ws = () => {
    for (;;) {
      while (i < s.length && /\s/.test(s[i])) i++;
      if (s.startsWith('//', i)) {
        while (i < s.length && s[i] !== '\n') i++;
        continue;
      }
      break;
    }
  };
  const str = (): string => {
    ws();
    if (s[i] === '"') {
      i++;
      let out = '';
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && i + 1 < s.length) {
          const n = s[i + 1];
          out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
          i += 2;
          continue;
        }
        out += s[i++];
      }
      i++;
      return out;
    }
    const st = i;
    while (i < s.length && !/[\s{}"]/.test(s[i])) i++;
    return s.slice(st, i);
  };
  const obj = (): VdfObject => {
    const o: VdfObject = {};
    for (;;) {
      ws();
      if (i >= s.length) return o;
      if (s[i] === '}') {
        i++;
        return o;
      }
      const k = str();
      ws();
      if (s[i] === '{') {
        i++;
        o[k] = obj();
      } else {
        o[k] = str();
      }
    }
  };
  return obj();
}
