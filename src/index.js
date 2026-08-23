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

const parseEnvOrigins = (envVar) => {
  if (!envVar) return [];
  return envVar
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const defaultOrigins = [
  'https://football-website-mocha.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

const envOrigins = [
  ...parseEnvOrigins(process.env.ALLOWED_ORIGINS),
  ...parseEnvOrigins(process.env.CLIENT_URL),
  ...parseEnvOrigins(process.env.EXTERNAL_APP_URL),
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

console.log('🔒 Configured CORS Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    if (allowedOrigins.includes(cleanOrigin) || /\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
    return callback(new Error(`CORS policy error: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
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

  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`🚀 TOUCHES Express Server listening on http://${HOST}:${PORT} (Port: ${PORT})`);
  });
};

startServer();
