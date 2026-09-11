import { describe, expect, it } from 'vitest';
import { selectTargetTab } from '../lib/tab-target';

describe('popup target page selection', () => {
  it('selects the active supported web tab', () => {
    expect(selectTargetTab([
      { id: 1, url: 'http://127.0.0.1:4181/ticket1.html', active: true, lastAccessed: 20 },
    ])).toMatchObject({ id: 1, url: 'http://127.0.0.1:4181/ticket1.html' });
  });

  it('does not fall back to an older web page when the active page is unsupported', () => {
    expect(selectTargetTab([
      { id: 1, url: 'https://older.example/', active: false, lastAccessed: 20 },
      { id: 2, url: 'chrome://extensions', active: true, lastAccessed: 30 },
    ])).toBeUndefined();
  });
});
