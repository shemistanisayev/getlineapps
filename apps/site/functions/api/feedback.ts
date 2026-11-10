/**
 * POST /api/feedback: Cloudflare Pages Function, one endpoint for every tool.
 * Logic, honeypot and rate limit live in @line/site-kit. Secrets are set with
 *   npx wrangler pages secret put RESEND_API_KEY --project-name getlineapps
 *   npx wrangler pages secret put FEEDBACK_TO --project-name getlineapps
 */
export { onRequestPost } from '@line/site-kit/feedback';
