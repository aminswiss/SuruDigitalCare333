module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // parse x-www-form-urlencoded
  const data = await new Promise((resolve) => {
    let d = '';
    req.on('data', chunk => d += chunk);
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(d))));
  });
  const name = (data.name||'').toString().trim();
  const email = (data.email||'').toString().trim();
  const phone = (data.phone||'').toString().trim();
  const service = (data.service||'').toString().trim();
  const message = (data.message||'').toString().trim();
  if(!name || !email || !service || !message) return res.status(400).json({ success:false, error:'Missing required fields' });
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL;
  if(!SENDGRID_API_KEY) return res.status(500).json({ success:false, error:'SendGrid API key not configured' });
  if(!FROM_EMAIL) return res.status(500).json({ success:false, error:'FROM_EMAIL not configured' });
  const payload = {
    personalizations: [{ to: [{ email: 'support@surudigitalcare.com' }, { email: 'SuruDigitalCare@gmail.com' }], subject: `Estimate Request: ${service}` }],
    from: { email: FROM_EMAIL },
    reply_to: { email: email },
    content: [{ type: 'text/plain', value: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\nMessage:\n${message}\n` }]
  };
  try {
    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + SENDGRID_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (resp.status >= 200 && resp.status < 300) {
      return res.status(200).json({ success: true });
    } else {
      const text = await resp.text();
      return res.status(500).json({ success:false, error: `SendGrid API error: ${resp.status} ${text}` });
    }
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message || String(err) });
  }
};