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

// === 1. CORS CONFIGURATION ===
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

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    const isVercelApp = /\.vercel\.app$/.test(cleanOrigin);
    const isExplicitlyAllowed = allowedOrigins.includes(cleanOrigin);
    if (isExplicitlyAllowed || isVercelApp) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

// === 4. STRIPE WEBHOOK RAW BODY (Must come BEFORE express.json parser) ===
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

// === 2. PORT BINDING & ASYNC DB CONNECT ===
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
  connectDB(); // async, doesn't block the port binding
});
