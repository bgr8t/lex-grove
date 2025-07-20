import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
import { requireEnvVar } from '../src/utils/security';

import { verifyAuth, requirePremiumAccess, requireAdmin } from '../src/api/middleware/auth';
import { searchValidator, briefValidator, profileValidator, idValidator } from '../src/api/middleware/validation';
import { generateCsrfToken, verifyCsrfToken } from '../src/api/middleware/csrf';
import { sessionRotationManager } from '../src/utils/sessionUtils';
import { createCheckoutSession, checkSubscriptionStatus } from '../src/api/index';
import { flashcardsRouter } from '../src/api/flashcards';
import {
    searchHandler,
    getBriefHandler,
    createBriefHandler,
    updateBriefHandler,
    deleteBriefHandler,
    getProfileHandler,
    updateProfileHandler,
    csrfTokenHandler,
    adminDashboardHandler
} from '../src/api/handlers';

config();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
}

const db = getFirestore();
const FirestoreStore = MongoStore.create({
    mongoUrl: requireEnvVar('MONGO_URL'),
    collectionName: 'sessions',
    ttl: 8 * 60 * 60,
});

const app = express();
const PORT = process.env.PORT || 3000;

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', apiLimiter);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            fontSrc: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://your-production-domain.com'
        : 'http://localhost:8080',
    credentials: true
}));

app.use(session({
    store: FirestoreStore,
    secret: requireEnvVar('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: 'strict',
        domain: process.env.NODE_ENV === 'production' ? '.your-domain.com' : undefined
    },
    rolling: true,
    name: '__Host-session',
}));

app.use('/api', sessionRotationManager.middleware);

// Define API routes
app.get('/api/csrf-token', csrfTokenHandler);

app.get('/api/search', ...searchValidator, searchHandler);
app.get('/api/briefs/:id', ...idValidator, getBriefHandler);
app.post('/api/briefs', verifyCsrfToken, requirePremiumAccess, ...briefValidator, createBriefHandler);
app.put('/api/briefs/:id', verifyCsrfToken, requirePremiumAccess, ...idValidator, ...briefValidator, updateBriefHandler);
app.delete('/api/briefs/:id', verifyCsrfToken, requirePremiumAccess, ...idValidator, deleteBriefHandler);

app.get('/api/profile', verifyAuth, getProfileHandler);
app.put('/api/profile', verifyCsrfToken, verifyAuth, ...profileValidator, updateProfileHandler);

app.get('/api/check-subscription', verifyAuth, checkSubscriptionStatus);
app.post('/api/create-checkout-session', verifyCsrfToken, verifyAuth, createCheckoutSession);

app.use('/api/flashcards', verifyAuth, flashcardsRouter);

app.get('/api/admin/dashboard', requireAdmin, adminDashboardHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app; 