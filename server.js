// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/', (req, res) => {
  res.send('✅ Resend backend is running');
});

app.post('/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, or html.' });
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
    });

    if (!data || data.error) {
      console.error('❌ Resend response error:', data?.error || 'No response');
      return res.status(500).send({ success: false, error: data?.error || 'Failed to send email' });
    }

    res.status(200).send({ success: true, data });
  } catch (error) {
    console.error('❌ Resend exception:', error);
    res.status(500).send({ success: false, error: error?.message || 'Unknown server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
