/**
 * Byte <-> text with round-trip safety. Most B42 files are UTF-8, but older (B41) configs
 * may contain single-byte extended characters; those are read/written as latin1 so the
 * bytes survive untouched.
 */

export type TextEncodingName = 'utf8' | 'latin1';

export interface DecodedText {
  text: string;
  encoding: TextEncodingName;
  bom: boolean;
}

export function decodeText(buf: Uint8Array): DecodedText {
  const bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const body = bom ? buf.subarray(3) : buf;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body);
    return { text, encoding: 'utf8', bom };
  } catch {
    const parts: string[] = [];
    for (let i = 0; i < body.length; i += 0x8000) {
      parts.push(String.fromCharCode(...body.subarray(i, i + 0x8000)));
    }
    return { text: parts.join(''), encoding: 'latin1', bom };
  }
}

export function encodeText(d: { text: string; encoding: TextEncodingName; bom?: boolean }): Uint8Array {
  let bytes: Uint8Array;
  if (d.encoding === 'latin1') {
    bytes = new Uint8Array(d.text.length);
    for (let i = 0; i < d.text.length; i++) {
      const c = d.text.charCodeAt(i);
      bytes[i] = c > 0xff ? 0x3f : c;
    }
  } else {
    bytes = new TextEncoder().encode(d.text);
  }
  if (!d.bom) return bytes;
  const out = new Uint8Array(bytes.length + 3);
  out.set([0xef, 0xbb, 0xbf]);
  out.set(bytes, 3);
  return out;
}
