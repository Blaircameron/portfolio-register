
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  const scopes = [
    'openid','profile','email',
    'accounting.transactions','accounting.contacts','accounting.settings',
    'offline_access'
  ].join(' ');
  const state = Math.random().toString(36).substring(7);
  const url = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  res.redirect(url);
}
