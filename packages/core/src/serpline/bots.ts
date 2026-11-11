/** AI crawlers checked against robots.txt (SPEC §4.4). Config: add a row to extend. */
import { decide, parseRobots, ruleText, type Robots } from './robots.ts';

export type BotGroup = 'search' | 'training';
/** Owner badge: a Mark name from @line/ui, or `commoncrawl` for the "CC" letters. */
export type BotOwner =
  'openai' | 'anthropic' | 'perplexity' | 'google' | 'apple' | 'commoncrawl' | 'bytedance' | 'meta';

export interface Bot {
  group: BotGroup;
  userAgent: string;
  /** "Shown as" in the panel (product names, never translated). */
  shownAs: string;
  owner: BotOwner;
}

export const BOTS: readonly Bot[] = [
  { group: 'search', userAgent: 'OAI-SearchBot', shownAs: 'ChatGPT search', owner: 'openai' },
  { group: 'search', userAgent: 'ChatGPT-User', shownAs: 'ChatGPT browsing', owner: 'openai' },
  { group: 'search', userAgent: 'Claude-SearchBot', shownAs: 'Claude search', owner: 'anthropic' },
  { group: 'search', userAgent: 'Claude-User', shownAs: 'Claude browsing', owner: 'anthropic' },
  {
    group: 'search',
    userAgent: 'PerplexityBot',
    shownAs: 'Perplexity answers',
    owner: 'perplexity',
  },
  {
    group: 'search',
    userAgent: 'Perplexity-User',
    shownAs: 'Perplexity browsing',
    owner: 'perplexity',
  },
  { group: 'training', userAgent: 'GPTBot', shownAs: 'OpenAI', owner: 'openai' },
  { group: 'training', userAgent: 'ClaudeBot', shownAs: 'Anthropic', owner: 'anthropic' },
  { group: 'training', userAgent: 'Google-Extended', shownAs: 'Gemini', owner: 'google' },
  { group: 'training', userAgent: 'Applebot-Extended', shownAs: 'Apple', owner: 'apple' },
  { group: 'training', userAgent: 'CCBot', shownAs: 'Common Crawl', owner: 'commoncrawl' },
  { group: 'training', userAgent: 'Bytespider', shownAs: 'ByteDance', owner: 'bytedance' },
  { group: 'training', userAgent: 'Meta-ExternalAgent', shownAs: 'Meta', owner: 'meta' },
];

/** `allowed`: own group allows. `allowed_default`: no own group, `*` allows ("Allowed by *"). */
export type BotState = 'allowed' | 'allowed_default' | 'blocked';

export interface BotStatus extends Bot {
  state: BotState;
  /** For a blocked bot: the robots lines that block it, as one line for the UI. */
  rule?: string;
  ruleLine?: number;
}

export interface RobotsFile {
  status: number;
  text: string;
}

/** Robots status of the site: 404 (or any 4xx) means all allowed (RFC 9309 §2.3.1.3). */
export function robotsFor(file: RobotsFile | null | undefined): Robots | null {
  if (!file || file.status < 200 || file.status >= 300) return null;
  return parseRobots(file.text);
}

export function botStatuses(robots: Robots | null, path: string): BotStatus[] {
  return BOTS.map((bot) => {
    if (!robots) return { ...bot, state: 'allowed_default' as const };
    const d = decide(robots, bot.userAgent, path);
    if (!d.allowed && d.rule) {
      return {
        ...bot,
        state: 'blocked' as const,
        rule: ruleText(robots, bot.userAgent, d.rule),
        ruleLine: d.rule.line,
      };
    }
    return { ...bot, state: d.own ? ('allowed' as const) : ('allowed_default' as const) };
  });
}
