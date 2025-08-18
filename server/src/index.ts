import 'dotenv/config'; 
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import postsRoutes from './routes/posts';
import { connectDB } from './config/db';

const PORT = Number(process.env.PORT || 4000);
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

const app = express();

const corsOptions = {
  origin: APP_ORIGIN,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postsRoutes);

// DB connect and start
connectDB(process.env.MONGO_URI || '');
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));