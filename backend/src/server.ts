import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { runAgent } from './agent';
import { getFromNotionTool } from './tools/notionMemory';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'TheTechX Chat Agent backend is running' });
});

app.get('/api/history', async (req, res) => {
  const { mobile } = req.query;

  if (!mobile || typeof mobile !== 'string') {
    return res.status(400).json({ error: 'mobile query param (string) is required' });
  }

  try {
    const historyResult = await getFromNotionTool.invoke({ mobile });
    if (historyResult === 'No previous conversation found.') {
      return res.json({ history: [] });
    }
    const history = JSON.parse(historyResult);
    return res.json({ history });
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, sessionId, agentState } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) is required' });
  }

  try {
    const result = await runAgent(message, agentState || {});
    return res.json({ response: result.response, agentState: result.state });
  } catch (err) {
    console.error('Agent error:', err);
    return res.status(500).json({ error: 'Agent failed to respond' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TheTechX Chat Agent backend → http://localhost:${PORT}`);
  console.log(`Health check → http://localhost:${PORT}/health`);
});

