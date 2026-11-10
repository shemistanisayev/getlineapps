/**
 * /api/feedback: one Cloudflare Pages Function for every tool (docs/line-family-domains.md).
 * Sends the message to the owner through Resend. Honeypot plus a basic rate limit. No database.
 *
 * Use in apps/site/functions/api/feedback.ts:
 *   export { onRequestPost } from '@line/site-kit/feedback';
 * Secrets (never in the repo): npx wrangler pages secret put RESEND_API_KEY --project-name getlineapps
 */
import { LINE_SITE_URL, isToolSlug, type ToolSlug } from '@line/core/site';

export interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface FeedbackEnv {
  RESEND_API_KEY?: string;
  FEEDBACK_TO?: string;
  FEEDBACK_FROM?: string;
  /** Optional KV namespace for a rate limit shared by all isolates. */
  FEEDBACK_KV?: RateLimitStore;
}

export interface FeedbackOptions {
  /** Requests allowed per IP per window. */
  limit?: number;
  windowSeconds?: number;
  fetch?: typeof fetch;
  now?: () => number;
  /** Origins allowed to post. getlineapps.com and localhost by default. */
  allowedOrigins?: string[];
}

export interface Feedback {
  tool: ToolSlug | 'site';
  reason: string;
  message: string;
  email: string;
  version: string;
  page: string;
}

export const FEEDBACK_LIMITS = {
  reason: 80,
  message: 2000,
  email: 200,
  version: 20,
  page: 200,
} as const;

/** The honeypot field. Real people never see or fill it. */
export const HONEYPOT_FIELD = 'website';

type Result = { ok: true; feedback: Feedback } | { ok: false; error: string };

const clean = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        // eslint-disable-next-line no-control-regex -- strip control characters from user input
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, max)
    : '';

export function parseFeedback(data: Record<string, unknown>): Result {
  const tool = clean(data.tool, 20);
  if (!(isToolSlug(tool) || tool === 'site')) return { ok: false, error: 'unknown_tool' };
  const reason = clean(data.reason, FEEDBACK_LIMITS.reason);
  const message = clean(data.message, FEEDBACK_LIMITS.message);
  if (!reason && !message) return { ok: false, error: 'empty' };
  const email = clean(data.email, FEEDBACK_LIMITS.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'bad_email' };
  const version = clean(data.v ?? data.version, FEEDBACK_LIMITS.version);
  if (version && !/^[0-9A-Za-z.+-]+$/.test(version)) return { ok: false, error: 'bad_version' };
  return {
    ok: true,
    feedback: {
      tool,
      reason,
      message,
      email,
      version,
      page: clean(data.page, FEEDBACK_LIMITS.page),
    },
  };
}

export function feedbackEmail(f: Feedback) {
  const name = f.tool === 'site' ? 'getlineapps.com' : f.tool[0]!.toUpperCase() + f.tool.slice(1);
  const subject = `${name} feedback${f.reason ? `: ${f.reason}` : ''}`;
  const head = [
    `Tool: ${f.tool}`,
    f.version ? `Version: ${f.version}` : '',
    f.reason ? `Reason: ${f.reason}` : '',
    f.email ? `Reply to: ${f.email}` : '',
    f.page ? `Page: ${f.page}` : '',
  ].filter(Boolean);
  return { subject, text: `${head.join('\n')}\n\n${f.message || '(no message)'}` };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) return (await request.json()) as Record<string, unknown>;
    if (type.includes('form')) return Object.fromEntries((await request.formData()).entries());
  } catch {
    return null;
  }
  return null;
}

export function createFeedbackHandler(opts: FeedbackOptions = {}) {
  const limit = opts.limit ?? 5;
  const windowSeconds = opts.windowSeconds ?? 600;
  const now = opts.now ?? Date.now;
  const doFetch = opts.fetch ?? fetch;
  const allowed = opts.allowedOrigins ?? [LINE_SITE_URL];
  const memory = new Map<string, { count: number; reset: number }>();

  function originOk(origin: string | null) {
    if (!origin) return true; // plain form posts from old browsers
    if (allowed.includes(origin)) return true;
    try {
      const host = new URL(origin).hostname;
      return (
        host === 'localhost' || host === '127.0.0.1' || host.endsWith('.getlineapps.pages.dev')
      );
    } catch {
      return false;
    }
  }

  async function overLimit(ip: string, env: FeedbackEnv) {
    const key = `fb:${ip}`;
    if (env.FEEDBACK_KV) {
      const count = Number((await env.FEEDBACK_KV.get(key)) ?? 0) + 1;
      await env.FEEDBACK_KV.put(key, String(count), { expirationTtl: windowSeconds });
      return count > limit;
    }
    const t = now();
    const e = memory.get(key);
    if (!e || e.reset <= t) {
      memory.set(key, { count: 1, reset: t + windowSeconds * 1000 });
      return false;
    }
    e.count += 1;
    return e.count > limit;
  }

  return async function handle(request: Request, env: FeedbackEnv): Promise<Response> {
    if (request.method !== 'POST') return json(405, { ok: false, error: 'method' });
    if (!originOk(request.headers.get('origin'))) return json(403, { ok: false, error: 'origin' });

    const data = await readBody(request);
    if (!data) return json(400, { ok: false, error: 'body' });

    // Bots fill every field. Pretend it worked so they do not retry.
    if (clean(data[HONEYPOT_FIELD], 200)) return json(200, { ok: true });

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (await overLimit(ip, env)) return json(429, { ok: false, error: 'rate_limited' });

    const parsed = parseFeedback(data);
    if (!parsed.ok) return json(400, parsed);

    if (!env.RESEND_API_KEY || !env.FEEDBACK_TO)
      return json(500, { ok: false, error: 'not_configured' });

    const { subject, text } = feedbackEmail(parsed.feedback);
    const res = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FEEDBACK_FROM ?? 'Line apps <feedback@getlineapps.com>',
        to: [env.FEEDBACK_TO],
        subject,
        text,
        ...(parsed.feedback.email ? { reply_to: parsed.feedback.email } : {}),
      }),
    });
    if (!res.ok) return json(502, { ok: false, error: 'send_failed' });
    return json(200, { ok: true });
  };
}

const defaultHandler = createFeedbackHandler();

/** Cloudflare Pages Functions entry. */
export const onRequestPost = (ctx: { request: Request; env: FeedbackEnv }) =>
  defaultHandler(ctx.request, ctx.env);
