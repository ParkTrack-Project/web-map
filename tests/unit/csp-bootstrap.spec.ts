import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';

describe('production CSP bootstrap', () => {
  it('uses only external scripts in the HTML shell', () => {
    const scripts = [...html.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script>/gi)];

    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every((match) => /\bsrc=/.test(match[1] ?? ''))).toBe(true);
    expect(html).toContain('<script src="/bootstrap.js"></script>');
  });
});
