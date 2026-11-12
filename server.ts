import 'dotenv/config';
import express from 'express';
import handler from './api/[...route].js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('/api/*', (req: any, res: any) => {
  // Vercel handler reads req.url for routing
  req.url = req.originalUrl;
  handler(req, res).catch((err: any) => {
    console.error('[API Error]', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });
});

app.listen(3001, () => console.log('API server on http://localhost:3001'));
