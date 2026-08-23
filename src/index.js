import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handleWebhook } from './controllers/paymentController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.EXTERNAL_APP_URL,
  process.env.ALLOWED_ORIGINS,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]
  .filter(Boolean)
  .flatMap((url) => url.split(',').map((o) => o.trim()));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, origin || true);
      } else {
        callback(null, origin || true);
      }
    },
    credentials: true,
  })
);
app.use(morgan('dev'));

// STRIPE RAW WEBHOOK ENDPOINT (Must come BEFORE express.json parser)
app.post('/api/payment/webhook', express.raw({ type: '*/*' }), handleWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api', apiRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TOUCHES Full-Stack API',
    docs: '/api/health',
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 TOUCHES Express Server listening on http://localhost:${PORT}`);
  });
};

startServer();
