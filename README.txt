Suru Digital Care — Final v3
Generated: 2025-12-04T17:37:14.226813Z

This release improves styling (uses Google Fonts Inter) and keeps robust serverless form handling.

Important:
- Do NOT commit your SendGrid API key. Use Vercel environment variables:
  SENDGRID_API_KEY = <your key>
  FROM_EMAIL = surudigitalcare@gmail.com

- Ensure /api/sendgrid_send.js is in the api/ folder (Vercel serverless functions require this).

Deploy steps:
1) Push this folder to GitHub root (keep api/ and server/ folders)
2) Import repo in Vercel and deploy
3) Add env vars in Vercel (Production)
4) Redeploy and test the form

If you still see a “Primary error: Forbidden”:
- Confirm SENDGRID_API_KEY is valid and FROM_EMAIL is verified in SendGrid.
- Check Vercel Function logs (Project → Functions → /api/sendgrid_send → Latest Execution) and paste any error here.
