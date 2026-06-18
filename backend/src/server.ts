import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'TheTechX Chat Agent backend is running' });
});

app.post('/api/chat', async (req, res) => {
  const { message, sessionId, agentState } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) is required' });
  }

  // TODO: Uncomment and use once you implement the agent
  // import { runAgent } from './agent';
  //
  // try {
  //   const result = await runAgent(message, agentState || {});
  //   return res.json({ response: result.response, agentState: result.state });
  // } catch (err) {
  //   console.error('Agent error:', err);
  //   return res.status(500).json({ error: 'Agent failed to respond' });
  // }

  return res.json({
    response:
      'Backend is running! Agent not implemented yet — see guide.md to get started.',
    agentState: { sessionId: sessionId || 'placeholder' },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TheTechX Chat Agent backend → http://localhost:${PORT}`);
  console.log(`Health check → http://localhost:${PORT}/health`);
});
