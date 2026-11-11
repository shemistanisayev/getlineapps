/**
 * robots.txt per RFC 9309 (SPEC §4.4): groups by User-agent, Allow / Disallow with `*` and `$`,
 * longest match wins, Allow wins a tie, a bot without its own group falls back to `*`.
 */

export interface RobotsRule {
  allow: boolean;
  path: string;
  /** 1-based line number in the file. */
  line: number;
}

export interface RobotsGroup {
  /** Lower-cased product tokens of the group's User-agent lines. */
  agents: string[];
  rules: RobotsRule[];
  /** 1-based line numbers of the group's User-agent lines. */
  agentLines: number[];
}

export interface Robots {
  groups: RobotsGroup[];
  sitemaps: string[];
  /** Number of lines in the file (a trailing newline does not add one). */
  lineCount: number;
  lines: string[];
}

export function parseRobots(text: string): Robots {
  const lines = text.replace(/^\u{FEFF}/u, '').split(/\r\n|\r|\n/);
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  // A run of User-agent lines starts one group; a rule line closes the run.
  let collectingAgents = false;

  lines.forEach((raw, i) => {
    const content = raw.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(content);
    if (!m) return;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === 'user-agent') {
      if (!collectingAgents || !current) {
        current = { agents: [], rules: [], agentLines: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      current.agentLines.push(i + 1);
      collectingAgents = true;
    } else if (key === 'allow' || key === 'disallow') {
      collectingAgents = false;
      // An empty Disallow allows everything: no rule.
      if (current && value)
        current.rules.push({ allow: key === 'allow', path: value, line: i + 1 });
    } else if (key === 'sitemap') {
      if (value) sitemaps.push(value);
    } else {
      // Other records (Crawl-delay, Host ...) do not start or end a group.
    }
  });

  return { groups, sitemaps, lineCount: lines.length, lines };
}

/** Does a robots path pattern match `path` (path + query)? Supports `*` and a final `$`. */
export function patternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = body
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp('^' + re + (anchored ? '$' : '')).test(path);
}

/** Percent-encode like a crawler would before matching (keeps `/`, `?`, `=`, `&`, `%`). */
function normalizePath(p: string): string {
  try {
    return encodeURI(decodeURI(p));
  } catch {
    return p;
  }
}

/** Groups that apply to `userAgent` (its own groups, else the `*` groups). */
export function groupsFor(
  robots: Robots,
  userAgent: string,
): { own: boolean; groups: RobotsGroup[] } {
  const ua = userAgent.toLowerCase();
  const own = robots.groups.filter((g) => g.agents.includes(ua));
  if (own.length) return { own: true, groups: own };
  return { own: false, groups: robots.groups.filter((g) => g.agents.includes('*')) };
}

export interface RobotsDecision {
  allowed: boolean;
  /** Bot has its own group. */
  own: boolean;
  /** Winning rule, if any matched. */
  rule?: RobotsRule;
}

export function decide(robots: Robots, userAgent: string, path: string): RobotsDecision {
  const { own, groups } = groupsFor(robots, userAgent);
  const target = normalizePath(path || '/');
  let best: RobotsRule | undefined;
  for (const g of groups) {
    for (const r of g.rules) {
      if (!patternMatches(normalizePath(r.path), target)) continue;
      if (
        !best ||
        r.path.length > best.path.length ||
        (r.path.length === best.path.length && r.allow && !best.allow)
      ) {
        best = r;
      }
    }
  }
  // /robots.txt itself is always allowed (RFC 9309 §2.2.2).
  if (target === '/robots.txt') return { allowed: true, own };
  return { allowed: best ? best.allow : true, own, rule: best };
}

/** The lines to show under a blocked bot: its User-agent line and the matching rule. */
export function ruleText(robots: Robots, userAgent: string, rule: RobotsRule): string {
  const { own } = groupsFor(robots, userAgent);
  const agent = own ? userAgent : '*';
  return `User-agent: ${agent}  ${rule.allow ? 'Allow' : 'Disallow'}: ${rule.path}`;
}
