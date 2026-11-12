import 'dotenv/config';
import express from 'express';
import handler from './api/[...route].js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.all('/api/*', (req: any, res: any) => handler(req, res));

app.listen(3001, () => console.log('API server running on http://localhost:3001'));
