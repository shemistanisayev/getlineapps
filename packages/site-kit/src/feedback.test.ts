import { describe, expect, it, vi } from 'vitest';
import {
  createFeedbackHandler,
  feedbackEmail,
  parseFeedback,
  type FeedbackEnv,
} from './feedback.ts';

const env: FeedbackEnv = {
  RESEND_API_KEY: 're_test',
  FEEDBACK_TO: 'owner@example.com',
  FEEDBACK_FROM: 'Line apps <feedback@getlineapps.com>',
};

function post(body: Record<string, string>, headers: Record<string, string> = {}) {
  return new Request('https://getlineapps.com/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4', ...headers },
    body: JSON.stringify(body),
  });
}

const okFetch = () =>
  vi.fn(
    async (_url: string | URL | Request, _init?: RequestInit) =>
      new Response('{}', { status: 200 }),
  );

describe('parseFeedback', () => {
  it('accepts a normal uninstall reason', () => {
    const r = parseFeedback({ tool: 'hitline', reason: 'Too complex', message: '', v: '1.0.0' });
    expect(r.ok).toBe(true);
  });

  it('rejects unknown tools, empty messages and bad emails', () => {
    expect(parseFeedback({ tool: 'other', reason: 'x' })).toEqual({
      ok: false,
      error: 'unknown_tool',
    });
    expect(parseFeedback({ tool: 'serpline' })).toEqual({ ok: false, error: 'empty' });
    expect(parseFeedback({ tool: 'serpline', message: 'hi', email: 'nope' })).toEqual({
      ok: false,
      error: 'bad_email',
    });
  });

  it('trims long fields', () => {
    const r = parseFeedback({ tool: 'foldline', message: 'a'.repeat(5000) });
    expect(r.ok && r.feedback.message.length).toBe(2000);
  });
});

describe('feedbackEmail', () => {
  it('builds a readable plain text email', () => {
    const { subject, text } = feedbackEmail({
      tool: 'hitline',
      reason: 'Missing a feature',
      message: 'Please add Pinterest.',
      email: '',
      version: '1.2.0',
      page: '',
    });
    expect(subject).toBe('Hitline feedback: Missing a feature');
    expect(text).toBe(
      'Tool: hitline\nVersion: 1.2.0\nReason: Missing a feature\n\nPlease add Pinterest.',
    );
  });
});

describe('feedback handler', () => {
  it('sends through Resend', async () => {
    const f = okFetch();
    const handle = createFeedbackHandler({ fetch: f as unknown as typeof fetch });
    const res = await handle(
      post({ tool: 'hitline', reason: 'Other', message: 'Hi', email: 'a@b.co' }),
      env,
    );
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledOnce();
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect((init!.headers as Record<string, string>).authorization).toBe('Bearer re_test');
    const body = JSON.parse(init!.body as string);
    expect(body.to).toEqual(['owner@example.com']);
    expect(body.reply_to).toBe('a@b.co');
  });

  it('accepts form posts', async () => {
    const f = okFetch();
    const handle = createFeedbackHandler({ fetch: f as unknown as typeof fetch });
    const req = new Request('https://getlineapps.com/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'tool=markline&reason=Not+useful&v=0.1.0',
    });
    expect((await handle(req, env)).status).toBe(200);
  });

  it('silently drops honeypot hits', async () => {
    const f = okFetch();
    const handle = createFeedbackHandler({ fetch: f as unknown as typeof fetch });
    const res = await handle(
      post({ tool: 'hitline', message: 'buy', website: 'spam.example' }),
      env,
    );
    expect(res.status).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });

  it('rate limits per IP', async () => {
    const f = okFetch();
    let t = 0;
    const handle = createFeedbackHandler({
      fetch: f as unknown as typeof fetch,
      limit: 2,
      windowSeconds: 60,
      now: () => t,
    });
    const send = () => handle(post({ tool: 'hitline', message: 'x' }), env);
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
    t = 61_000;
    expect((await send()).status).toBe(200);
  });

  it('uses KV for the limit when bound', async () => {
    const store = new Map<string, string>();
    const kv = {
      get: async (k: string) => store.get(k) ?? null,
      put: async (k: string, v: string) => void store.set(k, v),
    };
    const handle = createFeedbackHandler({ fetch: okFetch() as unknown as typeof fetch, limit: 1 });
    const e = { ...env, FEEDBACK_KV: kv };
    expect((await handle(post({ tool: 'hitline', message: 'x' }), e)).status).toBe(200);
    expect((await handle(post({ tool: 'hitline', message: 'x' }), e)).status).toBe(429);
  });

  it('refuses other origins, bad bodies and other methods', async () => {
    const handle = createFeedbackHandler({ fetch: okFetch() as unknown as typeof fetch });
    expect(
      (
        await handle(
          post({ tool: 'hitline', message: 'x' }, { origin: 'https://evil.example' }),
          env,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await handle(
          post({ tool: 'hitline', message: 'x' }, { origin: 'http://localhost:4321' }),
          env,
        )
      ).status,
    ).toBe(200);
    expect((await handle(new Request('https://getlineapps.com/api/feedback'), env)).status).toBe(
      405,
    );
    const bad = new Request('https://getlineapps.com/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{nope',
    });
    expect((await handle(bad, env)).status).toBe(400);
  });

  it('reports a missing secret and a failed send', async () => {
    const handle = createFeedbackHandler({
      fetch: (async () => new Response('', { status: 500 })) as unknown as typeof fetch,
    });
    expect((await handle(post({ tool: 'hitline', message: 'x' }), {})).status).toBe(500);
    expect((await handle(post({ tool: 'hitline', message: 'x' }), env)).status).toBe(502);
  });
});
