import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { YoutubeTranscript } from './node_modules/youtube-transcript/dist/youtube-transcript.esm.js';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure OpenAI client for OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/DevTube", // Optional, for OpenRouter rankings
    "X-Title": "DevTube", // Optional
  }
});

app.get('/api/transcript', async (req, res) => {
  const { v: videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.json(transcript);
  } catch (error) {
    console.error('Transcript error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript. Ensure the video has captions enabled.' });
  }
});

app.post('/api/analyze', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  try {
    console.log('Starting analysis via OpenRouter (google/gemini-2.0-flash-001)...');
    
    // We'll use Gemini 2.0 Flash via OpenRouter
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: "You are a specialized coding tutor. Analyze the following YouTube video transcript and produce two things in a JSON format: 1. A list of 'conceptMatches': Each should have a 'timestamp' (in seconds), 'topic' (short name), and a 'description'. 2. A list of 'codeSnippets': Each should have a 'timestamp' (in seconds) and the 'code' associated with that time in the video."
        },
        {
          role: "user",
          content: `Focus on coding-related content. If the transcript contains code explanations, extract the representative code snippets.\n\nTranscript:\n${transcript}\n\nReturn ONLY valid JSON in this structure:\n{\n  "conceptMatches": [{ "timestamp": 0, "topic": "...", "description": "..." }],\n  "codeSnippets": [{ "timestamp": 0, "code": "..." }]\n}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze transcript.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, transcript, history } = req.body;

  try {
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant for a specific coding video. Answer the user's question based on the transcript provided below. Be concise and helpful.\n\nTranscript Context:\n${transcript}`
      }
    ];

    // Map history to OpenAI format
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.parts ? h.parts[0].text : h.content
        });
      });
    }

    messages.push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: messages
    });

    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
