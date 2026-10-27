import { describe, expect, it } from 'vitest';
import { SteamcmdWorkshopParser, isConnectionFailure, isPermanentFailure, type WorkshopEvent } from '../src/services/steamcmdOutput.js';

describe('SteamCMD workshop output parser', () => {
  it('parses results printed back-to-back on one line (real output)', () => {
    const out =
      'ERROR! Download item 3475347500 failed (No Connection).Downloading item 3635394848 ...\n' +
      'ERROR! Download item 3635394848 failed (No Connection).Downloading item 3736813592 ...\n' +
      'ERROR! Download item 3616192072 failed (Timeout).Downloading item 3497172953 ...\n' +
      'Success. Downloaded item 3626823538 to "/var/lib/pzsm/server/steamapps/workshop/content/108600/3626823538" (241861 bytes) Downloading item 3422220305 ...\n';
    const ev = new SteamcmdWorkshopParser().feed(out);
    expect(ev.filter((e) => e.type === 'failure').map((e) => (e as { id: string }).id)).toEqual(['3475347500', '3635394848', '3616192072']);
    expect(ev.find((e) => e.type === 'success')).toEqual({ type: 'success', id: '3626823538', bytes: 241861 });
    expect(ev.filter((e) => e.type === 'start').length).toBe(4);
  });

  it('never emits a result from a partially received message', () => {
    const p = new SteamcmdWorkshopParser();
    const full = 'Success. Downloaded item 3626823538 to "/x/3626823538" (241861 bytes) ERROR! Download item 99 failed (No Connection).';
    const events: WorkshopEvent[] = [];
    for (let i = 0; i < full.length; i += 7) events.push(...p.feed(full.slice(i, i + 7)));
    expect(events).toEqual([
      { type: 'success', id: '3626823538', bytes: 241861 },
      { type: 'failure', id: '99', reason: 'No Connection' },
    ]);
  });

  it('detects login failures and classifies reasons', () => {
    expect(new SteamcmdWorkshopParser().feed('Connecting anonymously to Steam Public...FAILED (No Connection)\n')).toEqual([{ type: 'login-failed', reason: 'No Connection' }]);
    expect(isConnectionFailure('No Connection')).toBe(true);
    expect(isConnectionFailure('Timeout')).toBe(true);
    expect(isPermanentFailure('File Not Found')).toBe(true);
    expect(isPermanentFailure('No Connection')).toBe(false);
  });
});
