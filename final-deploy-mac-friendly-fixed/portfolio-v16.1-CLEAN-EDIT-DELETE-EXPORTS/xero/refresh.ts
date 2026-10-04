
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory demo - in v17 final we save to Supabase xero_tokens table
// This endpoint auto-refreshes if called within 60 days
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { refresh_token } = req.body || req.query;
  if (!refresh_token) return res.status(400).json({ error: 'Provide refresh_token in body or ?refresh_token=...' });

  const clientId = process.env.XERO_CLIENT_ID!;
  const clientSecret = process.env.XERO_CLIENT_SECRET!;

  const tokenRes = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token as string,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) return res.status(500).json(tokens);

  return res.json({
    message: 'Refreshed! Save these new tokens - new 60-day clock started',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    expires_at: new Date(Date.now() + tokens.expires_in*1000).toISOString(),
  });
}
