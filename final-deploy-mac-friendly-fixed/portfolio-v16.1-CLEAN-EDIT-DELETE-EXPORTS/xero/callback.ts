
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code from Xero');

  const clientId = process.env.XERO_CLIENT_ID!;
  const clientSecret = process.env.XERO_CLIENT_SECRET!;
  const redirectUri = process.env.XERO_REDIRECT_URI!;

  // Exchange code for tokens
  const tokenRes = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) return res.status(500).json(tokens);

  // Get connections (your orgs) - this is Option A
  const connRes = await fetch('https://api.xero.com/connections', {
    headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' },
  });
  const connections = await connRes.json();

  // For now, just show success page with orgs - later we save to Supabase
  res.setHeader('Content-Type', 'text/html');
  return res.send(`
    <h1>✅ Xero Connected (Test)</h1>
    <p>Access token expires in ${tokens.expires_in / 60} mins. Refresh token valid 60 days.</p>
    <h2>Your Orgs (Option A - ${connections.length} found):</h2>
    <pre>${JSON.stringify(connections, null, 2)}</pre>
    <h3>Next: Save these tenantId to entities.xero_tenant_id</h3>
    <p>Tokens:</p>
    <pre>${JSON.stringify({access_token: tokens.access_token.substring(0,50)+'...', refresh_token: tokens.refresh_token.substring(0,30)+'...', expires_at: new Date(Date.now() + tokens.expires_in*1000).toISOString()}, null, 2)}</pre>
    <p><b>Copy this page</b> and send to dev - we will wire auto-refresh.</p>
  `);
}
