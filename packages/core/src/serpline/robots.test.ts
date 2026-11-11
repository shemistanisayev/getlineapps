/** RFC 9309 cases for the robots.txt parser and the AI bot statuses (SPEC §4.4). */
import { describe, expect, it } from 'vitest';
import { BOTS, botStatuses, robotsFor } from './bots.ts';
import { decide, parseRobots, patternMatches } from './robots.ts';

const allowed = (txt: string, ua: string, path: string) =>
  decide(parseRobots(txt), ua, path).allowed;

describe('robots.txt parser', () => {
  it('groups consecutive User-agent lines and collects Sitemap lines anywhere', () => {
    const r = parseRobots(
      '﻿User-agent: A\nUser-agent: B # two bots\nDisallow: /x\n\nSitemap: https://e.com/s.xml\nUser-agent: C\nAllow: /\n',
    );
    expect(r.groups.map((g) => g.agents)).toEqual([['a', 'b'], ['c']]);
    expect(r.sitemaps).toEqual(['https://e.com/s.xml']);
    expect(r.lineCount).toBe(7);
  });

  it('longest match wins; Allow wins a tie', () => {
    const txt = 'User-agent: *\nDisallow: /shop\nAllow: /shop/public\nDisallow: /a\nAllow: /a\n';
    expect(allowed(txt, 'Bot', '/shop/cart')).toBe(false);
    expect(allowed(txt, 'Bot', '/shop/public/x')).toBe(true);
    expect(allowed(txt, 'Bot', '/a/b')).toBe(true);
  });

  it('supports * and $', () => {
    expect(patternMatches('/*.pdf$', '/files/a.pdf')).toBe(true);
    expect(patternMatches('/*.pdf$', '/files/a.pdf?x=1')).toBe(false);
    expect(patternMatches('/p*/q', '/products/q')).toBe(true);
    expect(patternMatches('/fish', '/fish.html')).toBe(true);
    expect(patternMatches('/fish/', '/fish')).toBe(false);
    const txt = 'User-agent: *\nDisallow: /*?sort=\n';
    expect(allowed(txt, 'Bot', '/list?sort=asc')).toBe(false);
    expect(allowed(txt, 'Bot', '/list')).toBe(true);
  });

  it('a bot with its own group ignores *; others fall back to *', () => {
    const txt = 'User-agent: *\nDisallow: /\n\nUser-agent: GoodBot\nAllow: /\n';
    expect(decide(parseRobots(txt), 'goodbot', '/x')).toMatchObject({ allowed: true, own: true });
    expect(decide(parseRobots(txt), 'OtherBot', '/x')).toMatchObject({
      allowed: false,
      own: false,
    });
  });

  it('merges groups for the same bot, treats an empty Disallow as allow-all', () => {
    const txt =
      'User-agent: X\nDisallow: /a\n\nUser-agent: X\nDisallow: /b\n\nUser-agent: Y\nDisallow:\n';
    expect(allowed(txt, 'X', '/a')).toBe(false);
    expect(allowed(txt, 'X', '/b')).toBe(false);
    expect(allowed(txt, 'Y', '/anything')).toBe(true);
  });

  it('matches percent-encoded and plain paths alike, and never blocks /robots.txt', () => {
    expect(allowed('User-agent: *\nDisallow: /caf%C3%A9\n', 'B', '/café')).toBe(false);
    expect(allowed('User-agent: *\nDisallow: /\n', 'B', '/robots.txt')).toBe(true);
  });

  it('ignores unknown records and rules before any User-agent', () => {
    const txt =
      'Disallow: /early\nCrawl-delay: 5\nUser-agent: *\nCrawl-delay: 10\nDisallow: /late\n';
    expect(allowed(txt, 'B', '/early')).toBe(true);
    expect(allowed(txt, 'B', '/late')).toBe(false);
  });
});

describe('AI bots', () => {
  it('has the 13 SPEC bots in two groups', () => {
    expect(BOTS).toHaveLength(13);
    expect(BOTS.filter((b) => b.group === 'search')).toHaveLength(6);
  });

  it('404 or a failed robots.txt means everything is allowed', () => {
    expect(robotsFor({ status: 404, text: 'Not found' })).toBeNull();
    expect(robotsFor({ status: 0, text: '' })).toBeNull();
    expect(botStatuses(null, '/').every((b) => b.state === 'allowed_default')).toBe(true);
  });

  it('reports the blocking line for a blocked bot (own group or *)', () => {
    const robots = robotsFor({
      status: 200,
      text: 'User-agent: *\nDisallow: /private\n\nUser-agent: GPTBot\nDisallow: /\n',
    });
    const s = botStatuses(robots, '/private/page');
    expect(s.find((b) => b.userAgent === 'GPTBot')).toMatchObject({
      state: 'blocked',
      rule: 'User-agent: GPTBot  Disallow: /',
      ruleLine: 5,
    });
    expect(s.find((b) => b.userAgent === 'CCBot')).toMatchObject({
      state: 'blocked',
      rule: 'User-agent: *  Disallow: /private',
    });
    expect(botStatuses(robots, '/').find((b) => b.userAgent === 'CCBot')!.state).toBe(
      'allowed_default',
    );
  });
});
