import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY missing in .env');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.post('/chat', async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is empty'
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
    console.error('AI Error:', error.message);

    res.status(503).json({
      error: 'SADI AI is temporarily unavailable. Please try again.'
    });
  }
});

app.listen(3000, '127.0.0.1', () => {
  console.log('SADI AI running at http://127.0.0.1:3000');
});
