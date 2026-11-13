/**
 * Render Steam Workshop BBCode to a small, safe HTML subset. All text is escaped first;
 * only whitelisted tags are produced, links/images must be http(s).
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeUrl = (u: string) => {
  const t = u.trim().replace(/&amp;/g, '&');
  if (!/^https?:\/\//i.test(t)) return null;
  return esc(t);
};

export function bbcodeToHtml(src: string, opts: { images?: boolean } = {}): string {
  let s = esc(src.replace(/\r\n?/g, '\n'));
  s = s.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_, u: string) => {
    const url = safeUrl(u);
    return url && opts.images !== false ? `<img src="${url}" loading="lazy" referrerpolicy="no-referrer" alt="" />` : '';
  });
  s = s.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_, u: string, t: string) => {
    const url = safeUrl(u);
    return url ? `<a href="${url}" target="_blank" rel="noreferrer noopener">${t}</a>` : t;
  });
  s = s.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, u: string) => {
    const url = safeUrl(u);
    return url ? `<a href="${url}" target="_blank" rel="noreferrer noopener">${u}</a>` : u;
  });
  const pairs: [RegExp, string, string][] = [
    [/\[b\]/gi, '<strong>', ''],
    [/\[\/b\]/gi, '</strong>', ''],
    [/\[i\]/gi, '<em>', ''],
    [/\[\/i\]/gi, '</em>', ''],
    [/\[u\]/gi, '<u>', ''],
    [/\[\/u\]/gi, '</u>', ''],
    [/\[strike\]/gi, '<s>', ''],
    [/\[\/strike\]/gi, '</s>', ''],
    [/\[h[1-3]\]/gi, '<h4>', ''],
    [/\[\/h[1-3]\]\n?/gi, '</h4>', ''],
    [/\[list\]\n?/gi, '<ul>', ''],
    [/\[olist\]\n?/gi, '<ol>', ''],
    [/\[\/list\]\n?/gi, '</ul>', ''],
    [/\[\/olist\]\n?/gi, '</ol>', ''],
    [/\[\*\]/g, '<li>', ''],
    [/\[quote(=[^\]]*)?\]/gi, '<blockquote>', ''],
    [/\[\/quote\]\n?/gi, '</blockquote>', ''],
    [/\[code\]/gi, '<pre>', ''],
    [/\[\/code\]\n?/gi, '</pre>', ''],
    [/\[hr\]\[\/hr\]|\[hr\]/gi, '<hr />', ''],
    [/\[spoiler\]/gi, '<span class="bb-spoiler">', ''],
    [/\[\/spoiler\]/gi, '</span>', ''],
  ];
  for (const [re, html] of pairs) s = s.replace(re, html);
  // Drop any tags we don't know (table, noparse, previewyoutube, ...).
  s = s.replace(/\[\/?[a-z0-9]+(=[^\]]*)?\]/gi, '');
  s = s.replace(/\n/g, '<br />');
  return s;
}

/** Plain-text version (short descriptions, search). */
export function bbcodeToText(src: string): string {
  return src
    .replace(/\[img\][\s\S]*?\[\/img\]/gi, '')
    .replace(/\[\/?[a-z0-9*]+(=[^\]]*)?\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
