import cors from 'cors';
import express from 'express';
import clientRoutes from './routes/client.js';
import adminRoutes from './routes/admin.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = express();
const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

const corsOptions = {
  origin(origin, callback) {
    if (!origin || devOriginPattern.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ success: true, message: 'ok' });
});

app.use('/api/client', clientRoutes);
app.use('/api/admin', adminRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    success: false,
    message: error.message || 'server error'
  });
});

app.listen(config.port, config.host, () => {
  console.log(`server running at http://${config.host}:${config.port}`);
});
