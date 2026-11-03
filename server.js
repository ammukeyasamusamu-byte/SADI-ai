import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY missing in .env');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: false
}));

// Request size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// Chat rate limit
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.post('/chat', chatLimiter, async (req, res) => {
  try {
    const message = req.body?.message;

    if (typeof message !== 'string' ||
        !message.trim() ||
        message.length > 4000) {
      return res.status(400).json({
        error: 'Invalid message. Maximum 4000 characters.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: message.trim(),
      config: {
        systemInstruction:
          'You are SADI AI, a friendly and helpful AI assistant. Reply clearly and naturally.'
      }
    });

    res.send(response.text || 'No response received.');

  } catch (error) {
    console.error('AI request failed');

    res.status(503).json({
      error: 'SADI AI is temporarily unavailable. Please try again.'
    });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`SADI AI running at http://127.0.0.1:${PORT}`);
});
