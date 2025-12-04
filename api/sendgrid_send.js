 // api/sendgrid_send.js  (paste this file into your repo /api folder)
const fetch = global.fetch || require('node-fetch'); // Vercel has fetch; fallback for local tests
const SENDGRID_API_HOST = 'https://api.sendgrid.com/v3/mail/send';

function parseBodyRaw(req, rawText) {
  // Try to parse as JSON, otherwise parse as urlencoded
  try {
    const j = JSON.parse(rawText);
    return j;
  } catch(e) {
    // urlencoded -> Object.fromEntries(new URLSearchParams(rawText))
    try {
      return Object.fromEntries(new URLSearchParams(rawText));
    } catch(e2) {
      return {};
    }
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

  // Read raw body text (works for form POST and JSON)
  const raw = await new Promise((resolve) => {
    let d = '';
    req.on('data', chunk => d += chunk);
    req.on('end', () => resolve(d));
  });

  // Parse body robustly
  const data = parseBodyRaw(req, raw || '');

  // Log for debugging (check Vercel function logs)
  console.log('DEBUG raw body:', raw);
  console.log('DEBUG parsed body:', data);

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const service = String(data.service || '').trim();
  const message = String(data.message || '').trim();

  // Return very specific missing-field errors
  const missing = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!service) missing.push('service');
  if (!message) missing.push('message');
  if (missing.length) {
    const msg = 'Missing required fields: ' + missing.join(', ');
    console.error('Validation error:', msg);
    return res.status(400).json({ success:false, error: msg, received: { name, email, service, message, phone }});
  }

  // Check env vars
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL;
  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    return res.status(500).json({ success:false, error:'Server not configured: missing SENDGRID_API_KEY or FROM_EMAIL in env' });
  }

  // Build sendgrid payload
  const payload = {
    personalizations: [{
      to: [{ email: 'support@surudigitalcare.com' }, { email: 'SuruDigitalCare@gmail.com' }],
      subject: `Estimate Request: ${service}`,
    }],
    from: { email: FROM_EMAIL },
    reply_to: { email },
    content: [{ type: 'text/plain', value:
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\nMessage:\n${message}\n`
    }]
  };

  try {
    const apiResp = await fetch(SENDGRID_API_HOST, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await apiResp.text();
    // If non-2xx, return SendGrid body for easier debugging
    if (!apiResp.ok) {
      console.error('SendGrid returned non-OK:', apiResp.status, text);
      return res.status(500).json({ success:false, error: `SendGrid error ${apiResp.status}`, details: text });
    }
    console.log('SendGrid success', apiResp.status);
    return res.status(200).json({ success:true });
  } catch (err) {
    console.error('SendGrid fetch exception:', err && err.message ? err.message : err);
    return res.status(500).json({ success:false, error: 'SendGrid send exception', details: String(err && err.message ? err.message : err) });
  }
};
