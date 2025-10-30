// 1. Abhängigkeiten importieren
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
import { Pool } from 'pg'; // Import the pg Pool class directly

// E-Mail-Versand mit Resend
import { Resend } from 'resend';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

dotenv.config();

// 2. Initialisierung
const app = express();
const PORT = process.env.PORT || 4242;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';

// E-Mail-Client-Initialisierung
const resend = new Resend(process.env.RESEND_API_KEY);

// E-Mail-Architektur
const EMAIL_ADDRESSES = {
  SYSTEM: process.env.EMAIL_SYSTEM || 'noreply@kinkly.eu',      // System-E-Mails (Verifizierung, Magic Links)
  WAITLIST: process.env.EMAIL_WAITLIST || 'waitlist@kinkly.eu', // Waitlist-spezifische E-Mails
  CONTACT: process.env.EMAIL_CONTACT || 'contact@kinkly.eu',    // Öffentliche Kontaktadresse
  CIRCLE: process.env.EMAIL_CIRCLE || 'circle@kinkly.eu',       // Elite-Einladungen
  EVENTS: process.env.EMAIL_EVENTS || 'events@kinkly.eu'        // Event-Updates
};

// Default sender (for system emails like verification, magic links)
const EMAIL_FROM = process.env.EMAIL_FROM || `Kinkly Berlin <${EMAIL_ADDRESSES.SYSTEM}>`;

// --- Lightweight in-memory rate limiter ---
const rateLimitBuckets = new Map();
function createRateLimiter(options) {
  const windowMs = options.windowMs;
  const max = options.max;
  const keyGenerator = options.keyGenerator || ((req) => req.ip || req.headers['x-forwarded-for'] || 'unknown');
  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);
    let bucket = rateLimitBuckets.get(key);
    if (!bucket) {
      bucket = [];
      rateLimitBuckets.set(key, bucket);
    }
    // drop old
    while (bucket.length && (now - bucket[0]) > windowMs) bucket.shift();
    if (bucket.length >= max) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }
    bucket.push(now);
    next();
  };
}

// --- Honeypot & Time-Trap guards ---
function formGuards(minMs = 2000) {
  return (req, res, next) => {
    try {
      // TEMPORARILY DISABLED FOR DEVELOPMENT/TESTING
      return next();
      const body = req.body || {};
      const honeypot = (body.website || body.hp || body.honeypot || '').toString().trim();
      if (honeypot.length > 0) {
        return res.status(400).json({ error: 'Spam detected' });
      }
      if (body.formRenderedAt) {
        const renderedAt = Number(body.formRenderedAt);
        if (Number.isFinite(renderedAt)) {
          if (Date.now() - renderedAt < minMs) {
            return res.status(400).json({ error: 'Form submitted too quickly' });
          }
        }
      }
      next();
    } catch {
      next();
    }
  };
}

// --- Cloudflare Turnstile verification ---
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;
async function verifyTurnstileToken(token, remoteip) {
  if (!TURNSTILE_SECRET) return true; // if not configured, allow (dev)
  try {
    const params = new URLSearchParams();
    params.append('secret', TURNSTILE_SECRET);
    params.append('response', token || '');
    if (remoteip) params.append('remoteip', remoteip);
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await resp.json();
    return !!data.success;
  } catch (e) {
    console.error('Turnstile verify error:', e);
    return false;
  }
}

function requireTurnstile(actionName) {
  return async (req, res, next) => {
    try {
      const token = req.body?.turnstileToken || req.headers['x-turnstile-token'];
      const ok = await verifyTurnstileToken(token, req.ip);
      if (!ok) return res.status(400).json({ error: 'Bot verification failed' });
      next();
    } catch (e) {
      return res.status(400).json({ error: 'Bot verification failed' });
    }
  };
}

// Specific limiters
const limitMagicLinkIp = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }); // 20/hour per IP
const limitEmailVerifyIp = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }); // 20/hour per IP
const limitWaitlistIp = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 60 }); // 60/hour per IP
const limitApplicationsIp = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10 }); // 10/10min per IP
const limitValidateCodeIp = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 120 }); // 120/10min per IP

// Disposable email domain guard (basic)
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','yopmail.com','discard.email','trashmail.com'
]);
function rejectDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = (email.split('@')[1] || '').toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

// E-Mail-Hilfsfunktionen
const sendEmail = async (to, subject, html, text, from = EMAIL_FROM) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: [to],
      subject: subject,
      html: html,
      text: text
    });
    
    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }
    
    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

// Send email with CC to waitlist@kinkly.eu
const sendEmailWithCC = async (to, subject, html, text, from = EMAIL_FROM) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: [to],
      cc: [EMAIL_ADDRESSES.WAITLIST],
      subject: subject,
      html: html,
      text: text
    });
    
    if (error) {
      console.error('Error sending email with CC:', error);
      return { success: false, error };
    }
    
    console.log('Email sent successfully with CC:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email with CC:', error);
    return { success: false, error };
  }
};

const sendEventInviteEmail = async (email, firstName, lastName, referralCode, customMessage = null) => {
  console.log('Sending event invite email to:', { email, firstName, lastName, referralCode, customMessage });
  
  const eventUrl = referralCode 
    ? `https://kinkly-main.vercel.app/event?elitePasscode=${referralCode}`
    : 'https://kinkly-main.vercel.app/event';
  
  const subject = 'Your Invitation to Kinkly Berlin';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">
      <h1 style="color: #fff; text-align: center; margin-bottom: 30px;">Kinkly Berlin</h1>
      
      <p>Dear ${firstName} ${lastName},</p>
      
      <p>You have been invited to join our exclusive event. The invitation awaits you.</p>
      
      ${customMessage ? `<div style="background-color: #111; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 3px solid #fff;">
        <p style="margin: 0; font-style: italic;">"${customMessage}"</p>
      </div>` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${eventUrl}" style="background-color: #fff; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Enter the Event
        </a>
      </div>
      
      <p style="color: #ccc; font-size: 14px; text-align: center; margin-top: 30px;">
        This is an exclusive invitation. Please do not share this link.
      </p>
    </div>
  `;
  
  const text = `
    Dear ${firstName} ${lastName},
    
    You have been invited to join our exclusive event. The invitation awaits you.
    
    ${customMessage ? `\nPersonal message: "${customMessage}"\n` : ''}
    
    Click here to enter: ${eventUrl}
    
    This is an exclusive invitation. Please do not share this link.
  `;
  
  // Use circle@ for elite invitations, waitlist@ for waitlist
  const fromAddress = referralCode 
    ? `Kinkly Berlin <${EMAIL_ADDRESSES.CIRCLE}>`
    : `Kinkly Berlin <${EMAIL_ADDRESSES.WAITLIST}>`;
  
  const result = await sendEmailWithCC(email, subject, html, text, fromAddress);
  console.log('Email send result:', result);
  return result;
};

const sendConfirmationEmail = async (fullName, email, tier) => {
  const subject = 'Welcome to Kinkly Berlin - Your Application is Confirmed';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">
      <h1 style="color: #fff; text-align: center; margin-bottom: 30px;">Kinkly Berlin</h1>
      
      <p>Dear ${fullName},</p>
      
      <p>Welcome to the inner circle. Your journey begins.</p>
      
      <div style="background-color: #111; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #fff; margin-top: 0;">Your Application Details:</h3>
        <p><strong>Tier:</strong> ${tier}</p>
        <p><strong>Status:</strong> Confirmed</p>
      </div>
      
      <p>Your confirmation has been sent to your email address. We will contact you soon with further details about the event.</p>
      
      <p style="color: #ccc; font-size: 14px; text-align: center; margin-top: 30px;">
        Thank you for joining Kinkly Berlin.
      </p>
    </div>
  `;
  
  const text = `
    Dear ${fullName},
    
    Welcome to the inner circle. Your journey begins.
    
    Your Application Details:
    - Tier: ${tier}
    - Status: Confirmed
    
    Your confirmation has been sent to your email address. We will contact you soon with further details about the event.
    
    Thank you for joining Kinkly Berlin.
  `;
  
  return await sendEmail(email, subject, html, text);
};


// Database-Konfiguration
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Render connections
    }
  });
  console.log('Postgres: DATABASE_URL detected, pool created.');
} else {
  console.warn('Postgres: DATABASE_URL is not set. API routes depending on DB will fail.');
}

// Create tables if they don't exist
const initializeDb = async () => {
  if (!pool) {
    console.warn('Skipping DB initialization: no pool (DATABASE_URL missing).');
    return;
  }
  try {
    // Check if old full_name column exists and migrate
    const checkColumn = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'applications' AND column_name = 'full_name'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('Migrating applications table...');
      // Add new columns if they don't exist
      await pool.query(`
        ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
      `);
      
      // Migrate data from full_name to first_name and last_name
      await pool.query(`
        UPDATE applications 
        SET first_name = SPLIT_PART(full_name, ' ', 1),
            last_name = CASE 
              WHEN POSITION(' ' IN full_name) > 0 
              THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
              ELSE ''
            END
        WHERE first_name IS NULL OR last_name IS NULL
      `);
      
      // Make columns NOT NULL after migration
      await pool.query(`
        ALTER TABLE applications 
        ALTER COLUMN first_name SET NOT NULL,
        ALTER COLUMN last_name SET NOT NULL
      `);
      
      // Drop old column
      await pool.query(`ALTER TABLE applications DROP COLUMN IF EXISTS full_name`);
      console.log('Migration completed successfully');
    }
    
    // Create or migrate applications table
    const applicationsCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'applications' AND column_name = 'referral_code_id'
    `);
    
    if (applicationsCheck.rows.length === 0) {
      console.log('Adding referral_code_id to applications table...');
      await pool.query(`
        ALTER TABLE applications 
        ADD COLUMN referral_code_id INTEGER REFERENCES referral_codes(id)
      `);
      console.log('Applications table migrated successfully');
    }
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT,
        tier VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending_payment',
        referral_code_id INTEGER REFERENCES referral_codes(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create prospects table for pre-purchase tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prospects (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        referral_code_id INTEGER REFERENCES referral_codes(id),
        source VARCHAR(50) DEFAULT 'preloader', -- 'preloader', 'event_page', 'admin'
        status VARCHAR(50) DEFAULT 'active', -- 'active', 'converted', 'expired'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES applications(id),
        payment_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES applications(id),
        max_uses INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create referral code usage tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_code_usage (
        id SERIAL PRIMARY KEY,
        referral_code_id INTEGER REFERENCES referral_codes(id),
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        used_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(referral_code_id, ip_address, session_id)
      );
    `);

    // Auth: users table (separate from applications for credentials/roles)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'user', -- user | referrer | admin
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Auth: magic links
    await pool.query(`
      CREATE TABLE IF NOT EXISTS magic_links (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Auth: email verification tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // Create or migrate event_settings table
    const eventSettingsCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'event_settings' AND column_name = 'invitation_tickets'
    `);
    
    if (eventSettingsCheck.rows.length === 0) {
      console.log('Migrating event_settings table...');
      // Check if old event_settings table exists
      const oldEventSettingsCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'event_settings' AND column_name = 'remaining_tickets'
      `);
      
      if (oldEventSettingsCheck.rows.length > 0) {
        // Add new columns to existing table
        await pool.query(`
          ALTER TABLE event_settings 
          ADD COLUMN IF NOT EXISTS invitation_tickets INTEGER DEFAULT 20,
          ADD COLUMN IF NOT EXISTS circle_tickets INTEGER DEFAULT 15,
          ADD COLUMN IF NOT EXISTS sanctum_tickets INTEGER DEFAULT 10
        `);
        console.log('Event settings table migrated successfully');
      } else {
        // Create new table
        await pool.query(`
          CREATE TABLE event_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
            invitation_tickets INTEGER DEFAULT 20,
            circle_tickets INTEGER DEFAULT 15,
            sanctum_tickets INTEGER DEFAULT 10,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        console.log('Event settings table created successfully');
      }
    }

    // Create email_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        template_key VARCHAR(50) PRIMARY KEY,
        subject TEXT NOT NULL,
        html TEXT NOT NULL,
        text_body TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed defaults if missing
    const defaults = [
      {
        key: 'waitlist_verify',
        subject: 'Please confirm your email address',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p style="color:#ddd;">Hello {{firstName}} {{lastName}},</p>\n  <p style="color:#ddd;">Confirm your email to join the circle: <a href="{{verifyUrl}}">Verify</a> (valid 24h)</p>\n  <p style="color:#aaa; font-size: 12px; margin-top: 24px;">If you didn\'t request this, you can safely ignore this email.</p>\n</div>',
        text: 'Hello {{firstName}} {{lastName}},\nVerify: {{verifyUrl}} (valid 24h)'
      },
      {
        key: 'post_verify_welcome',
        subject: 'Welcome to the Circle – We will be in touch',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p style="color:#ddd;">Welcome to the waitlist, {{firstName}}. We will be in touch with exclusive updates and invitations.</p>\n  <p style="color:#aaa; font-size: 14px; margin-top: 24px;">Willkommen im Wartekreis – wir melden uns mit Neuigkeiten und Einladungen.</p>\n</div>',
        text: 'Welcome to the waitlist. We will be in touch. / Willkommen im Wartekreis – wir melden uns.'
      },
      {
        key: 'invite',
        subject: 'Your Invitation to Kinkly Berlin',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p>Dear {{firstName}} {{lastName}},</p>\n  <p>You have been invited to join our exclusive event. The invitation awaits you.</p>\n  {{#if customMessage}}<div style="background-color:#111; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 3px solid #fff;">\n    <p style="margin:0; font-style: italic;">"{{customMessage}}"</p>\n  </div>{{/if}}\n  <div style="text-align:center; margin: 30px 0;">\n    <a href="{{eventUrl}}" style="background-color:#fff; color:#000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Enter the Event</a>\n  </div>\n  <p style="color:#ccc; font-size: 14px; text-align:center; margin-top: 30px;">This is an exclusive invitation. Please do not share this link.</p>\n</div>',
        text: 'Dear {{firstName}} {{lastName}},\nYou have been invited. Enter: {{eventUrl}}'
      },
      {
        key: 'magic_link',
        subject: 'Your secure login link',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p>Click to login: <a href="{{loginUrl}}">Login</a> (valid 15 minutes)</p>\n</div>',
        text: 'Login: {{loginUrl}} (valid 15 minutes)'
      }
    ];

    for (const d of defaults) {
      await pool.query(
        `INSERT INTO email_templates (template_key, subject, html, text_body)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (template_key) DO NOTHING`,
        [d.key, d.subject, d.html, d.text]
      );
    }
    // Create or migrate waitlist table
    const waitlistCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'waitlist' AND column_name = 'first_name'
    `);
    
    if (waitlistCheck.rows.length === 0) {
      console.log('Migrating waitlist table...');
      // Check if old waitlist table exists
      const oldWaitlistCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'waitlist' AND column_name = 'email'
      `);
      
      if (oldWaitlistCheck.rows.length > 0) {
        // Add new columns to existing table
        await pool.query(`
          ALTER TABLE waitlist 
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50)
        `);
        console.log('Waitlist table migrated successfully');
      } else {
        // Create new table
        await pool.query(`
          CREATE TABLE waitlist (
        id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
            referral_code VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        console.log('Waitlist table created successfully');
      }
    }
    console.log('Database tables are ready.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};


// Stripe-Konfiguration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal-Konfiguration
const Environment = process.env.NODE_ENV === 'production'
  ? paypal.core.LiveEnvironment
  : paypal.core.SandboxEnvironment;
const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

// 3. Middleware
// CORS: allow frontend origins and cookies
const FRONTEND_ORIGINS = [
  'https://kinkly-main.vercel.app',
  'https://kinkly-preloader.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.options('*', cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(cookieParser());

// Middleware to verify Stripe webhook signature
const verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.log('⚠️  Webhook secret or signature missing.');
    return res.sendStatus(400);
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    req.event = event; // Attach event to request for downstream handlers
    next();
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }
};

// Stripe Webhook-Route MUSS vor express.json() stehen, da sie den rohen Request-Body benötigt.
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), verifyStripeSignature, async (req, res) => {
  const event = req.event;
  console.log('Stripe webhook received:', event.type);

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const applicationId = paymentIntent.metadata.applicationId;
    console.log('Payment succeeded for application:', applicationId);

    if (applicationId) {
      try {
        await pool.query('BEGIN');
        await pool.query(
          `INSERT INTO payments (application_id, payment_method, transaction_id, amount, status)
           VALUES ($1, 'Stripe', $2, $3, $4)`,
          [applicationId, paymentIntent.id, paymentIntent.amount, paymentIntent.status]
        );
        const appResult = await pool.query(
          "UPDATE applications SET status = 'pending_review' WHERE id = $1 RETURNING first_name, last_name, email, tier, referral_code_id",
          [applicationId]
        );
        
        console.log('Application updated:', appResult.rows[0]);
        
        // Increment referral code usage count if referral code was used
        if (appResult.rows.length > 0 && appResult.rows[0].referral_code_id) {
          await pool.query(`
            UPDATE referral_codes 
            SET used_count = used_count + 1 
            WHERE id = $1
          `, [appResult.rows[0].referral_code_id]);
          console.log('Referral code usage incremented');
        }
        
        await pool.query('COMMIT');
        console.log(`Payment for application ${applicationId} recorded successfully.`);
        
        // Update remaining tickets
        if (appResult.rows.length > 0) {
          await updateRemainingTickets(appResult.rows[0].tier);
        }
        
        // Send confirmation email
        if (appResult.rows.length > 0) {
            const { first_name, last_name, email, tier } = appResult.rows[0];
            await sendConfirmationEmail(`${first_name} ${last_name}`, email, tier);
        }

      } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error recording Stripe payment in DB:', err);
      }
    }
  }

  res.send();
});


// JSON-Parser für alle anderen Routen
app.use(express.json());

// --- Simple HMAC-signed session tokens (no external deps) ---
const signToken = (payload) => {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
};

const verifyToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

const setSessionCookie = (res, payload) => {
  const token = signToken(payload);
  res.cookie('kinkly_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

// Minimal auth middlewares
const authenticateUser = (req, res, next) => {
  const raw = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.kinkly_session;
  const payload = verifyToken(raw);
  if (!payload) return res.status(401).json({ error: 'Not authenticated' });
  req.user = payload; // { uid, role }
  next();
};

const authorizeRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// 4. Hilfsfunktionen
const calculateOrderAmount = (priceString) => {
  if (!priceString) return 0;
  const cleanedPrice = priceString.replace(/€|\s/g, '').replace(/\./g, '').replace(',', '.');
  const priceNumber = parseFloat(cleanedPrice);
  return Math.round(priceNumber * 100);
};



// 5. API-Routen

// Health endpoints to help diagnose deployment issues
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// Current user info from cookie
app.get('/api/auth/me', authenticateUser, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, email, role FROM users WHERE id = $1`, [req.user.uid]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.error('auth/me error:', e);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// --- Auth: Magic link flow ---
app.post('/api/auth/request-magic-link', limitMagicLinkIp, requireTurnstile('magic_link'), formGuards(), async (req, res) => {
  const { email, redirectUrl } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    // Rate limit: max 3 per hour per email
    const rate = await pool.query(
      `SELECT COUNT(*)::int as cnt FROM magic_links WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [email]
    );
    if ((rate.rows[0]?.cnt || 0) >= 3) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }

    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await pool.query(
      `INSERT INTO magic_links (email, token, expires_at) VALUES ($1, $2, $3)`,
      [email, token, expiresAt]
    );

    const loginUrl = `${process.env.BACKEND_BASE_URL || 'https://kinkly-backend.onrender.com'}/api/auth/magic-login?token=${token}&redirect=${encodeURIComponent(
      redirectUrl || 'https://kinkly-main.vercel.app'
    )}`;

    await sendEmail(
      email,
      'Your secure login link',
      `<p>Click to login: <a href="${loginUrl}">Login</a> (valid 15 minutes)</p>`,
      `Login: ${loginUrl} (valid 15 minutes)`,
      `Kinkly Berlin <${EMAIL_ADDRESSES.SYSTEM}>`
    );
    res.json({ success: true });
  } catch (e) {
    console.error('request-magic-link error:', e);
    res.status(500).json({ error: 'Failed to create magic link' });
  }
});

app.get('/api/auth/magic-login', async (req, res) => {
  const { token, redirect } = req.query;
  if (!token) {
    return res.redirect('https://kinkly-main.vercel.app/event?error=missing_token');
  }
  try {
    const r = await pool.query(`SELECT * FROM magic_links WHERE token = $1`, [token]);
    if (r.rows.length === 0) {
      return res.redirect('https://kinkly-main.vercel.app/event?error=invalid_token');
    }
    const ml = r.rows[0];
    if (ml.used_at) {
      return res.redirect('https://kinkly-main.vercel.app/event?error=token_used');
    }
    if (new Date(ml.expires_at).getTime() < Date.now()) {
      return res.redirect('https://kinkly-main.vercel.app/event?error=token_expired');
    }

    // Ensure user exists
    const userRes = await pool.query(`
      INSERT INTO users (email)
      VALUES ($1)
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING id, email, role
    `, [ml.email]);
    const user = userRes.rows[0];

    // Mark used
    await pool.query(`UPDATE magic_links SET used_at = NOW() WHERE id = $1`, [ml.id]);

    // Set session cookie
    setSessionCookie(res, { uid: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    res.redirect((redirect && typeof redirect === 'string') ? redirect : 'https://kinkly-main.vercel.app/event');
  } catch (e) {
    console.error('magic-login error:', e);
    res.redirect('https://kinkly-main.vercel.app/event?error=login_failed');
  }
});

// --- User: get referrer stats for logged-in user ---
app.get('/api/user/referrer-stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user's referral code
    const codeRes = await pool.query(
      `SELECT code FROM referral_codes WHERE user_id = $1`,
      [userId]
    );
    
    if (codeRes.rows.length === 0) {
      return res.json({ 
        hasCode: false, 
        code: null, 
        totalReferrals: 0, 
        successfulPurchases: 0 
      });
    }
    
    const userCode = codeRes.rows[0].code;
    
    // Count total referrals (applications using this code)
    const totalRes = await pool.query(
      `SELECT COUNT(*) as total FROM applications WHERE referral_code_id = (
        SELECT id FROM referral_codes WHERE code = $1
      )`,
      [userCode]
    );
    
    // Count successful purchases (applications with successful payments)
    const successfulRes = await pool.query(
      `SELECT COUNT(*) as successful FROM applications a
       JOIN payments p ON a.id = p.application_id
       WHERE a.referral_code_id = (
         SELECT id FROM referral_codes WHERE code = $1
       ) AND p.status = 'completed'`,
      [userCode]
    );
    
    res.json({
      hasCode: true,
      code: userCode,
      totalReferrals: parseInt(totalRes.rows[0].total),
      successfulPurchases: parseInt(successfulRes.rows[0].successful)
    });
  } catch (e) {
    console.error('referrer-stats error:', e);
    res.status(500).json({ error: 'Failed to fetch referrer stats' });
  }
});

// --- Prospects: create prospect entry ---
app.post('/api/prospects', async (req, res) => {
  const { firstName, lastName, email, referralCode, source = 'preloader' } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Get referral code ID if provided
    let referralCodeId = null;
    if (referralCode) {
      const codeRes = await pool.query(
        `SELECT id FROM referral_codes WHERE code = $1 AND is_active = true`,
        [referralCode.toUpperCase()]
      );
      if (codeRes.rows.length > 0) {
        referralCodeId = codeRes.rows[0].id;
      }
    }
    
    // Insert or update prospect
    const result = await pool.query(`
      INSERT INTO prospects (first_name, last_name, email, referral_code_id, source)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, prospects.first_name),
        last_name = COALESCE(EXCLUDED.last_name, prospects.last_name),
        referral_code_id = COALESCE(EXCLUDED.referral_code_id, prospects.referral_code_id),
        source = EXCLUDED.source,
        updated_at = NOW()
      RETURNING id, status
    `, [firstName, lastName, email, referralCodeId, source]);
    
    res.json({ 
      success: true, 
      prospectId: result.rows[0].id,
      status: result.rows[0].status
    });
  } catch (e) {
    console.error('prospects error:', e);
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

// --- Prospects: get prospect by email ---
app.get('/api/prospects/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(`
      SELECT p.*, rc.code as referral_code
      FROM prospects p
      LEFT JOIN referral_codes rc ON p.referral_code_id = rc.id
      WHERE p.email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    console.error('get prospect error:', e);
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

// --- User: link elite passcode to logged-in user (waitlist/prospect association) ---
app.post('/api/user/add-passcode', authenticateUser, async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code is required' });
  
  try {
    // Validate the code exists and is active
    const codeRes = await pool.query(
      `SELECT id, user_id, max_uses, used_count, expires_at, is_active 
       FROM referral_codes 
       WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    );
    
    if (codeRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive code' });
    }
    
    const referralCode = codeRes.rows[0];
    
    // Check if code is expired
    if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code has expired' });
    }
    
    // Check if code has reached max uses
    if (referralCode.used_count >= referralCode.max_uses) {
      return res.status(400).json({ error: 'Code has reached maximum uses' });
    }
    
    // Check if user already has a code assigned
    const existingCodeRes = await pool.query(
      `SELECT id FROM referral_codes WHERE user_id = $1`,
      [req.user.uid]
    );
    
    if (existingCodeRes.rows.length > 0) {
      return res.status(400).json({ error: 'User already has a code assigned' });
    }
    
    // Assign the code to the user
    await pool.query(
      `UPDATE referral_codes SET user_id = $1 WHERE id = $2`,
      [req.user.uid, referralCode.id]
    );
    
    res.json({ success: true, message: 'Code successfully assigned' });
  } catch (e) {
    console.error('add-passcode error:', e);
    res.status(500).json({ error: 'Failed to assign code' });
  }
});

// --- Referrer stats for logged-in user ---
app.get('/api/user/referrer-stats', authenticateUser, async (req, res) => {
  try {
    // Determine application id(s) owned by this user's email
    const ue = await pool.query(`SELECT email FROM users WHERE id = $1`, [req.user.uid]);
    const email = ue.rows[0]?.email;
    if (!email) return res.status(404).json({ error: 'User not found' });

    // Find referral codes where owner application email matches
    const codes = await pool.query(`
      SELECT rc.id
      FROM referral_codes rc
      JOIN applications a ON rc.user_id = a.id
      WHERE a.email = $1
    `, [email]);

    if (codes.rows.length === 0) return res.json({ totalReferred: 0, totalWithPurchase: 0 });

    const codeIds = codes.rows.map(r => r.id);
    const inList = codeIds.map((_, i) => `$${i + 1}`).join(',');

    const totals = await pool.query(
      `SELECT 
         COUNT(*)::int as total,
         COUNT(CASE WHEN status IN ('pending_review','approved') THEN 1 END)::int as with_purchase
       FROM applications
       WHERE referral_code_id IN (${inList})`,
      codeIds
    );

    res.json({ totalReferred: totals.rows[0]?.total || 0, totalWithPurchase: totals.rows[0]?.with_purchase || 0 });
  } catch (e) {
    console.error('referrer-stats error:', e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// --- Auth: Email verification flow ---
app.post('/api/auth/request-email-verification', limitEmailVerifyIp, formGuards(), async (req, res) => {
  const { email, redirectUrl } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await pool.query(
      `INSERT INTO email_verifications (email, token, expires_at) VALUES ($1, $2, $3)`,
      [email, token, expiresAt]
    );
    const verifyUrl = `${process.env.BACKEND_BASE_URL || 'https://kinkly-backend.onrender.com'}/api/auth/verify-email?token=${token}&redirect=${encodeURIComponent(
      redirectUrl || 'https://kinkly-main.vercel.app'
    )}`;
    await sendEmail(
      email,
      'Verify your email address',
      `<p>Confirm your email: <a href="${verifyUrl}">Verify</a> (valid 24h)</p>`,
      `Verify: ${verifyUrl} (valid 24h)`,
      `Kinkly Berlin <${EMAIL_ADDRESSES.SYSTEM}>`
    );
    res.json({ success: true });
  } catch (e) {
    console.error('request-email-verification error:', e);
    res.status(500).json({ error: 'Failed to create verification' });
  }
});

app.get('/api/auth/verify-email', async (req, res) => {
  const { token, redirect } = req.query;
  if (!token) return res.status(400).send('Missing token');
  try {
    const r = await pool.query(`SELECT * FROM email_verifications WHERE token = $1`, [token]);
    if (r.rows.length === 0) return res.status(400).send('Invalid token');
    const ev = r.rows[0];
    if (ev.verified_at) return res.status(400).send('Already verified');
    if (new Date(ev.expires_at).getTime() < Date.now()) return res.status(400).send('Token expired');
    await pool.query(`UPDATE email_verifications SET verified_at = NOW() WHERE id = $1`, [ev.id]);
    try {
      const subject = 'Welcome to the Circle – We will be in touch';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">
          <h1 style=\"color: #fff; text-align: center; margin-bottom: 30px;\">Kinkly Berlin</h1>
          <p style=\"color:#ddd;\">Welcome to the waitlist. We will be in touch with exclusive updates and invitations.</p>
          <p style=\"color:#aaa; font-size: 14px; margin-top: 24px;\">Willkommen im Wartekreis – wir melden uns mit Neuigkeiten und Einladungen.</p>
        </div>
      `;
      const text = 'Welcome to the waitlist. We will be in touch. / Willkommen im Wartekreis – wir melden uns.';
      await sendEmail(ev.email, subject, html, text, `Kinkly Berlin <${EMAIL_ADDRESSES.WAITLIST}>`);
    } catch (e) {
      console.error('post-verify welcome email error:', e);
    }
    // Append verified=1 to help frontend clear soft-gate state
    const target = (redirect && typeof redirect === 'string') ? redirect : 'https://kinkly-main.vercel.app';
    const url = new URL(target);
    url.searchParams.set('verified', '1');
    res.redirect(url.toString());
  } catch (e) {
    console.error('verify-email error:', e);
    res.status(500).send('Verification failed');
  }
});

app.get('/db/health', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ ok: false, error: 'No database pool. Set DATABASE_URL.' });
  }
  try {
    const r = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Create a new application
app.post('/api/applications', limitApplicationsIp, formGuards(), async (req, res) => {
  const { firstName, lastName, email, message, tier, referralCodeId, elitePasscode } = req.body;
  if (!firstName || !lastName || !email || !tier) {
    return res.status(400).json({ error: 'First name, last name, email, and tier are required.' });
  }
  if (rejectDisposableEmail(email)) {
    return res.status(400).json({ error: 'Disposable email addresses are not allowed' });
  }
  // If exists in waitlist, we proceed but will mark prospect converted later
  
  try {
    if (!pool) {
      throw new Error('Database is not configured. Set DATABASE_URL in environment.');
    }
    
    // If elitePasscode is provided, find the corresponding referral_code_id
    let finalReferralCodeId = referralCodeId;
    if (elitePasscode && !referralCodeId) {
      const codeResult = await pool.query(
        'SELECT id FROM referral_codes WHERE code = $1 AND is_active = true',
        [elitePasscode.toUpperCase()]
      );
      if (codeResult.rows.length > 0) {
        finalReferralCodeId = codeResult.rows[0].id;
        console.log('Found referral code ID for elite passcode:', elitePasscode, '->', finalReferralCodeId);
      } else {
        console.log('Elite passcode not found or inactive:', elitePasscode);
      }
    }
    
    const result = await pool.query(
      'INSERT INTO applications (first_name, last_name, email, message, tier, referral_code_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [firstName, lastName, email, message || null, tier, finalReferralCodeId || null]
    );
    res.status(201).json({ applicationId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating application:', error);
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error.' : (error && error.message ? error.message : 'Internal server error.');
    res.status(500).json({ error: message });
  }
});


// Stripe-Route
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { price, applicationId } = req.body;
    if (!price || !applicationId) {
      return res.status(400).send({ error: 'Price and Application ID are required' });
    }
    const amount = calculateOrderAmount(price);
    if (amount <= 0) {
      return res.status(400).send({ error: 'Invalid price provided' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: { applicationId } // Link payment to application
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// PayPal-Routen
app.post('/api/paypal/create-order', async (req, res) => {
  const { price } = req.body;
  if (!price) {
    return res.status(400).send({ error: 'Price is required' });
  }
  
  const amountInCents = calculateOrderAmount(price);
  if (amountInCents <= 0) {
    return res.status(400).send({ error: 'Invalid price provided' });
  }
  const amountInEur = (amountInCents / 100).toFixed(2);

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: amountInEur
      }
    }]
  });

  try {
    const order = await paypalClient.execute(request);
    res.status(201).json({ orderID: order.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to create PayPal order.' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderID, applicationId } = req.body;
  if (!orderID || !applicationId) {
    return res.status(400).send({ error: 'Order ID and Application ID are required' });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    const captureResult = capture.result;
    
    if (captureResult.status === 'COMPLETED') {
       const purchaseUnit = captureResult.purchase_units[0];
       const amountInCents = parseFloat(purchaseUnit.payments.captures[0].amount.value) * 100;
       
       await pool.query('BEGIN');
       await pool.query(
        `INSERT INTO payments (application_id, payment_method, transaction_id, amount, status)
         VALUES ($1, 'PayPal', $2, $3, $4)`,
        [applicationId, captureResult.id, amountInCents, captureResult.status.toLowerCase()]
      );
      const appResult = await pool.query(
        "UPDATE applications SET status = 'pending_review' WHERE id = $1 RETURNING first_name, last_name, email, tier, referral_code_id",
        [applicationId]
      );
      
      // Increment referral code usage count if referral code was used
      if (appResult.rows.length > 0 && appResult.rows[0].referral_code_id) {
        await pool.query(`
          UPDATE referral_codes 
          SET used_count = used_count + 1 
          WHERE id = $1
        `, [appResult.rows[0].referral_code_id]);
      }
      
      await pool.query('COMMIT');
      console.log(`PayPal payment for application ${applicationId} recorded.`);

      // Update remaining tickets based on purchased tier
      if (appResult.rows.length > 0) {
        await updateRemainingTickets(appResult.rows[0].tier);
      }

      // Send confirmation email
       if (appResult.rows.length > 0) {
            const { first_name, last_name, email, tier } = appResult.rows[0];
            await sendConfirmationEmail(`${first_name} ${last_name}`, email, tier);
        }
    }

    res.json({ status: 'success', capture });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).send({ error: 'Failed to capture PayPal payment.' });
  }
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Environment-based token validation
  const validToken = process.env.ADMIN_TOKEN || 'admin123';
  if (token === validToken) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Environment-based admin credentials
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'kinkly2024';
  const adminToken = process.env.ADMIN_TOKEN || 'admin123';
  
  if (username === adminUsername && password === adminPassword) {
    res.json({ token: adminToken });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin endpoints
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.email,
        a.message,
        a.tier,
        a.status,
        a.created_at,
        EXISTS(SELECT 1 FROM referral_codes rcc WHERE rcc.user_id = a.id) AS is_referrer,
        (SELECT COUNT(*) FROM referral_codes rcc WHERE rcc.user_id = a.id) AS codes_count,
        (SELECT COUNT(*) FROM referral_code_usage u WHERE u.referral_code_id IN (SELECT id FROM referral_codes rcu WHERE rcu.user_id = a.id)) AS logins_count,
        (SELECT COUNT(*) FROM payments p 
           JOIN applications ap ON ap.id = p.application_id
           WHERE ap.referral_code_id IN (SELECT id FROM referral_codes rcs WHERE rcs.user_id = a.id)
             AND p.status IN ('completed','succeeded','paid')) AS sales_count
      FROM applications a
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (super admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if current user is super admin
    const adminUser = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.uid]);
    if (!adminUser.rows[0] || adminUser.rows[0].role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can delete users' });
    }
    
    await pool.query('DELETE FROM applications WHERE id = $1', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Create new user
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  const { firstName, lastName, email, message, tier } = req.body;
  
  if (!firstName || !lastName || !email || !tier) {
    return res.status(400).json({ error: 'First name, last name, email, and tier are required' });
  }
  
  try {
    // Block if email exists in waitlist
    const w = await pool.query('SELECT 1 FROM waitlist WHERE email = $1', [email]);
    if (w.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists in waitlist. Convert instead of creating duplicate.' });
    }
    const result = await pool.query(
      'INSERT INTO applications (first_name, last_name, email, message, tier, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, email, message || null, tier, 'pending_review']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Admin: convert waitlist entry to user (application)
app.post('/api/admin/waitlist/:id/convert', authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid waitlist id' });
    const wl = await pool.query(`SELECT * FROM waitlist WHERE id = $1`, [id]);
    if (wl.rows.length === 0) return res.status(404).json({ error: 'Waitlist entry not found' });
    const w = wl.rows[0];
    // prevent duplicate users
    const exists = await pool.query(`SELECT 1 FROM applications WHERE email = $1`, [w.email]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Email already exists as user' });
    // create user with tier 'waitlist'
    const created = await pool.query(
      `INSERT INTO applications (first_name, last_name, email, message, tier, status)
       VALUES ($1,$2,$3,$4,'waitlist','pending_review') RETURNING *`,
      [w.first_name || '', w.last_name || '', w.email, null]
    );
    res.json({ success: true, user: created.rows[0] });
  } catch (e) {
    console.error('convert waitlist error:', e);
    res.status(500).json({ error: 'Failed to convert waitlist entry' });
  }
});

// Update user
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, message, tier, status } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE applications SET first_name = $1, last_name = $2, email = $3, message = $4, tier = $5, status = $6 WHERE id = $7 RETURNING *',
      [firstName, lastName, email, message || null, tier, status || 'pending_review', id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/admin/referral-codes', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rc.*,
        CONCAT(a.first_name, ' ', a.last_name) as owner_name
      FROM referral_codes rc
      LEFT JOIN applications a ON rc.user_id = a.id
      ORDER BY rc.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching referral codes:', error);
    res.status(500).json({ error: 'Failed to fetch referral codes' });
  }
});

// Get all waitlist entries - TEMPORARY ENDPOINT
app.get('/api/waitlist', async (req, res) => {
  try {
    console.log('Fetching waitlist entries...');
    const result = await pool.query(`
      SELECT * FROM waitlist 
      ORDER BY created_at DESC
    `);
    console.log(`Found ${result.rows.length} waitlist entries`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// Get all waitlist entries
app.get('/api/admin/waitlist', authenticateAdmin, async (req, res) => {
  try {
    console.log('Fetching waitlist entries...');
    const result = await pool.query(`
      SELECT w.*, 
             CASE WHEN ev.verified_at IS NOT NULL THEN true ELSE false END as email_verified
      FROM waitlist w
      LEFT JOIN email_verifications ev ON w.email = ev.email AND ev.verified_at IS NOT NULL
      ORDER BY w.created_at DESC
    `);
    console.log(`Found ${result.rows.length} waitlist entries`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// Send event invite to waitlist person
// --- Admin: assign code to waitlist entry ---
app.post('/api/admin/waitlist/assign-code', authenticateAdmin, async (req, res) => {
  const { waitlistId, codeId } = req.body;
  
  if (!waitlistId || !codeId) {
    return res.status(400).json({ error: 'Waitlist ID and Code ID are required' });
  }
  
  try {
    // Check if code is available (not assigned to a user)
    const codeRes = await pool.query(
      `SELECT id, user_id FROM referral_codes WHERE id = $1 AND is_active = true`,
      [codeId]
    );
    
    if (codeRes.rows.length === 0) {
      return res.status(400).json({ error: 'Code not found or inactive' });
    }
    
    if (codeRes.rows[0].user_id) {
      return res.status(400).json({ error: 'Code is already assigned to a user' });
    }
    
    // Update waitlist entry with referral code
    await pool.query(
      `UPDATE waitlist SET referral_code = (
        SELECT code FROM referral_codes WHERE id = $1
      ) WHERE id = $2`,
      [codeId, waitlistId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning code to waitlist:', error);
    res.status(500).json({ error: 'Failed to assign code' });
  }
});

app.post('/api/admin/send-invite', authenticateAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, referralCode, customMessage } = req.body;
    
    console.log('Admin send-invite called with:', { email, firstName, lastName, referralCode, customMessage });
    
    // Send email using Resend
    const emailResult = await sendEventInviteEmail(email, firstName, lastName, referralCode, customMessage);
    
    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'Invite sent successfully',
        emailId: emailResult.data?.id
      });
    } else {
      console.error('Failed to send email:', emailResult.error);
      res.status(500).json({ 
        error: 'Failed to send invite email',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error sending invite:', error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

app.post('/api/admin/referral-codes', authenticateAdmin, async (req, res) => {
  const { userId, maxUses, expiresAt } = req.body;
  
  try {
    // Generate random referral code
    const code = generateReferralCode();
    
    const result = await pool.query(`
      INSERT INTO referral_codes (code, user_id, max_uses, expires_at, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [code, userId, maxUses, expiresAt || null]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating referral code:', error);
    res.status(500).json({ error: 'Failed to create referral code' });
  }
});

// Admin: list email templates
app.get('/api/admin/email-templates', authenticateAdmin, async (req, res) => {
  try {
    const r = await pool.query(`SELECT template_key, subject, html, text_body, updated_at FROM email_templates ORDER BY template_key`);
    res.json(r.rows);
  } catch (e) {
    console.error('email-templates list error:', e);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Admin: update single template
app.put('/api/admin/email-templates/:key', authenticateAdmin, async (req, res) => {
  const { key } = req.params;
  const { subject, html, text_body } = req.body || {};
  if (!subject || !html || !text_body) return res.status(400).json({ error: 'subject, html, text_body required' });
  try {
    const r = await pool.query(
      `UPDATE email_templates SET subject=$1, html=$2, text_body=$3, updated_at=NOW() WHERE template_key=$4 RETURNING template_key, subject, html, text_body, updated_at`,
      [subject, html, text_body, key]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('email-templates update error:', e);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Admin: seed defaults (idempotent)
app.post('/api/admin/email-templates/seed', authenticateAdmin, async (req, res) => {
  try {
    const defaults = [
      {
        key: 'waitlist_verify',
        subject: 'Please confirm your email address',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p style="color:#ddd;">Hello {{firstName}} {{lastName}},</p>\n  <p style="color:#ddd;">Confirm your email to join the circle: <a href="{{verifyUrl}}">Verify</a> (valid 24h)</p>\n  <p style="color:#aaa; font-size: 12px; margin-top: 24px;">If you didn\'t request this, you can safely ignore this email.</p>\n</div>',
        text: 'Hello {{firstName}} {{lastName}},\nVerify: {{verifyUrl}} (valid 24h)'
      },
      {
        key: 'post_verify_welcome',
        subject: 'Welcome to the Circle – We will be in touch',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p style="color:#ddd;">Welcome to the waitlist, {{firstName}}. We will be in touch with exclusive updates and invitations.</p>\n  <p style="color:#aaa; font-size: 14px; margin-top: 24px;">Willkommen im Wartekreis – wir melden uns mit Neuigkeiten und Einladungen.</p>\n</div>',
        text: 'Welcome to the waitlist. We will be in touch. / Willkommen im Wartekreis – wir melden uns.'
      },
      {
        key: 'invite',
        subject: 'Your Invitation to Kinkly Berlin',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p>Dear {{firstName}} {{lastName}},</p>\n  <p>You have been invited to join our exclusive event. The invitation awaits you.</p>\n  {{#if customMessage}}<div style="background-color:#111; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 3px solid #fff;">\n    <p style="margin:0; font-style: italic;">"{{customMessage}}"</p>\n  </div>{{/if}}\n  <div style="text-align:center; margin: 30px 0;">\n    <a href="{{eventUrl}}" style="background-color:#fff; color:#000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Enter the Event</a>\n  </div>\n  <p style="color:#ccc; font-size: 14px; text-align:center; margin-top: 30px;">This is an exclusive invitation. Please do not share this link.</p>\n</div>',
        text: 'Dear {{firstName}} {{lastName}},\nYou have been invited. Enter: {{eventUrl}}'
      },
      {
        key: 'magic_link',
        subject: 'Your secure login link',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">\n  <h1 style="color:#fff; text-align:center; margin-bottom: 30px;">Kinkly Berlin</h1>\n  <p>Click to login: <a href="{{loginUrl}}">Login</a> (valid 15 minutes)</p>\n</div>',
        text: 'Login: {{loginUrl}} (valid 15 minutes)'
      }
    ];
    for (const d of defaults) {
      await pool.query(
        `INSERT INTO email_templates (template_key, subject, html, text_body)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (template_key) DO UPDATE SET subject=EXCLUDED.subject, html=EXCLUDED.html, text_body=EXCLUDED.text_body, updated_at=NOW()`,
        [d.key, d.subject, d.html, d.text]
      );
    }
    res.json({ success: true });
  } catch (e) {
    console.error('email-templates seed error:', e);
    res.status(500).json({ error: 'Failed to seed templates' });
  }
});

// Update referral code
app.put('/api/admin/referral-codes/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { maxUses, expiresAt, isActive } = req.body;
  
  try {
    const result = await pool.query(`
      UPDATE referral_codes 
      SET max_uses = $1, expires_at = $2, is_active = $3
      WHERE id = $4
      RETURNING *
    `, [maxUses, expiresAt || null, isActive, id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating referral code:', error);
    res.status(500).json({ error: 'Failed to update referral code' });
  }
});

// Deactivate referral code
app.put('/api/admin/referral-codes/:id/deactivate', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      UPDATE referral_codes 
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deactivating referral code:', error);
    res.status(500).json({ error: 'Failed to deactivate referral code' });
  }
});

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    console.log('Fetching admin stats...');
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN a.status = 'pending_payment' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN a.status = 'pending_review' THEN 1 END) as pending_review,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM applications a
      LEFT JOIN payments p ON a.id = p.application_id
    `);
    
    console.log('Applications stats:', stats.rows[0]);
    
    // Get sold tickets by tier
    const soldTickets = await pool.query(`
      SELECT 
        COUNT(CASE WHEN a.tier = 'The Invitation' THEN 1 END) as invitation_sold,
        COUNT(CASE WHEN a.tier = 'The Circle' THEN 1 END) as circle_sold,
        COUNT(CASE WHEN a.tier = 'The Inner Sanctum' THEN 1 END) as sanctum_sold
      FROM applications a
      WHERE a.status IN ('pending_review', 'approved')
    `);
    
    console.log('Sold tickets:', soldTickets.rows[0]);
    
    let scarcity = await pool.query(`
      SELECT invitation_tickets, circle_tickets, sanctum_tickets FROM event_settings WHERE id = 1
    `);
    
    console.log('Scarcity settings:', scarcity.rows[0]);
    
    // If no event_settings found, create default values
    if (scarcity.rows.length === 0) {
      console.log('No event_settings found, creating default values...');
      await pool.query(`
        INSERT INTO event_settings (id, invitation_tickets, circle_tickets, sanctum_tickets)
        VALUES (1, 20, 15, 10)
        ON CONFLICT (id) DO NOTHING
      `);
      
      // Fetch again after creation
      scarcity = await pool.query(`
        SELECT invitation_tickets, circle_tickets, sanctum_tickets FROM event_settings WHERE id = 1
      `);
      console.log('New scarcity settings:', scarcity.rows[0]);
    }
    
    const scarcityData = scarcity.rows[0] || { invitation_tickets: 20, circle_tickets: 15, sanctum_tickets: 10 };
    
    const result = {
      ...stats.rows[0],
      // Available tickets (total - sold)
      invitation_tickets: scarcityData.invitation_tickets - (soldTickets.rows[0]?.invitation_sold || 0),
      circle_tickets: scarcityData.circle_tickets - (soldTickets.rows[0]?.circle_sold || 0),
      sanctum_tickets: scarcityData.sanctum_tickets - (soldTickets.rows[0]?.sanctum_sold || 0),
      // Sold tickets for admin display
      invitation_sold: soldTickets.rows[0]?.invitation_sold || 0,
      circle_sold: soldTickets.rows[0]?.circle_sold || 0,
      sanctum_sold: soldTickets.rows[0]?.sanctum_sold || 0
    };
    
    console.log('Final stats result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.put('/api/admin/scarcity', authenticateAdmin, async (req, res) => {
  const { invitationTickets, circleTickets, sanctumTickets } = req.body;
  
  try {
    await pool.query(`
      INSERT INTO event_settings (id, invitation_tickets, circle_tickets, sanctum_tickets)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET 
        invitation_tickets = $1,
        circle_tickets = $2,
        sanctum_tickets = $3,
        updated_at = NOW()
    `, [invitationTickets, circleTickets, sanctumTickets]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating scarcity:', error);
    res.status(500).json({ error: 'Failed to update scarcity' });
  }
});

// Elite Passcode validation endpoint
app.post('/api/auth/validate-code', limitValidateCodeIp, async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  
  try {
    // Get client IP and session info
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const sessionId = req.headers['x-session-id'] || `ip_${clientIP}_${Date.now()}`;
    
    const result = await pool.query(`
      SELECT rc.*, CONCAT(a.first_name, ' ', a.last_name) as referrer_name
      FROM referral_codes rc
      LEFT JOIN applications a ON rc.user_id = a.id
      WHERE rc.code = $1 AND rc.is_active = true
      AND (rc.expires_at IS NULL OR rc.expires_at > NOW())
      AND rc.used_count < rc.max_uses
    `, [code]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Der Elite Passcode passt nicht.' });
    }
    
    const referralCode = result.rows[0];

    // Record a non-destructive usage (login/entry attempt) for analytics
    try {
      await pool.query(
        `INSERT INTO referral_code_usage (referral_code_id, ip_address, user_agent, session_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (referral_code_id, ip_address, session_id) DO NOTHING`,
        [referralCode.id, clientIP, userAgent, sessionId]
      );
    } catch (e) {
      console.warn('referral_code_usage insert warning:', e.message);
    }

    res.json({ 
      valid: true, 
      referrerId: referralCode.user_id,
      referrerName: referralCode.referrer_name,
      referralCodeId: referralCode.id
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ error: 'Failed to validate code' });
  }
});

// Check if email exists in applications or waitlist
app.post('/api/check-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Check in applications table
    const appResult = await pool.query(`
      SELECT id, first_name, last_name, email, tier, status 
      FROM applications 
      WHERE email = $1
    `, [email]);
    
    // Check in waitlist table
    const waitlistResult = await pool.query(`
      SELECT id, first_name, last_name, email, referral_code 
      FROM waitlist 
      WHERE email = $1
    `, [email]);
    
    if (appResult.rows.length > 0) {
      const user = appResult.rows[0];
      return res.json({
        exists: true,
        type: 'application',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          tier: user.tier,
          status: user.status
        }
      });
    } else if (waitlistResult.rows.length > 0) {
      const user = waitlistResult.rows[0];
      return res.json({
        exists: true,
        type: 'waitlist',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          referralCode: user.referral_code
        }
      });
    } else {
      return res.json({
        exists: false
      });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// Waitlist endpoint
app.post('/api/waitlist', limitWaitlistIp, formGuards(), async (req, res) => {
  console.log('Waitlist API called with:', req.body);
  
  const { firstName, lastName, email, referralCode } = req.body;
  
  if (!email) {
    console.log('Validation failed (email required):', { email });
    return res.status(400).json({ error: 'Email is required' });
  }
  if (rejectDisposableEmail(email)) {
    return res.status(400).json({ error: 'Disposable email addresses are not allowed' });
  }
  // Prevent duplicate with applications
  const existsInApps = await pool.query('SELECT 1 FROM applications WHERE email = $1', [email]);
  if (existsInApps.rows.length > 0) {
    return res.status(409).json({ error: 'Email already exists as user. Please login instead.' });
  }
  
  if (!pool) {
    console.error('Database pool not available');
    return res.status(500).json({ error: 'Database not available' });
  }
  
  try {
    console.log('Inserting into waitlist:', { firstName, lastName, email, referralCode });
    
    const result = await pool.query(`
      INSERT INTO waitlist (first_name, last_name, email, referral_code) 
      VALUES (COALESCE($1, ''), COALESCE($2, ''), $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, waitlist.first_name),
        last_name = COALESCE(EXCLUDED.last_name, waitlist.last_name),
        referral_code = COALESCE(EXCLUDED.referral_code, waitlist.referral_code)
      RETURNING *
    `, [firstName || null, lastName || null, email, referralCode || null]);
    
    console.log('Waitlist entry created/updated:', result.rows[0]);
    
    // Send double opt-in verification email instead of invitation
    try {
      const token = crypto.randomBytes(24).toString('base64url');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      await pool.query(
        `INSERT INTO email_verifications (email, token, expires_at) VALUES ($1, $2, $3)`,
        [email, token, expiresAt]
      );
      const verifyUrl = `${process.env.BACKEND_BASE_URL || 'https://kinkly-backend.onrender.com'}/api/auth/verify-email?token=${token}&redirect=${encodeURIComponent('https://kinkly-main.vercel.app')}`;
      await sendEmail(
        email,
        'Please confirm your email address',
        `<p>Confirm your email to join the circle: <a href="${verifyUrl}">Verify</a> (valid 24h)</p>`,
        `Verify: ${verifyUrl} (valid 24h)`,
        `Kinkly Berlin <${EMAIL_ADDRESSES.SYSTEM}>`
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Do not fail the request if email fails
    }
    
    res.json({ 
      success: true, 
      hasReferralCode: !!referralCode,
      referralCode: referralCode 
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ 
      error: 'Failed to add to waitlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Event status endpoint (public)
app.get('/api/events/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT invitation_tickets, circle_tickets, sanctum_tickets FROM event_settings WHERE id = 1
    `);
    
    const tickets = result.rows[0] || { invitation_tickets: 20, circle_tickets: 15, sanctum_tickets: 10 };
    res.json({ 
      invitationTickets: tickets.invitation_tickets,
      circleTickets: tickets.circle_tickets,
      sanctumTickets: tickets.sanctum_tickets,
      totalTickets: tickets.invitation_tickets + tickets.circle_tickets + tickets.sanctum_tickets
    });
  } catch (error) {
    console.error('Error fetching event status:', error);
    res.status(500).json({ error: 'Failed to fetch event status' });
  }
});

// Update remaining tickets when payment is successful
const updateRemainingTickets = async (tier) => {
  try {
    let column = 'invitation_tickets'; // default for 'The Invitation'
    
    if (tier === 'The Circle') {
      column = 'circle_tickets';
    } else if (tier === 'The Inner Sanctum') {
      column = 'sanctum_tickets';
    } else if (tier === 'The Invitation') {
      column = 'invitation_tickets';
    }
    
    console.log(`Updating tickets for tier: "${tier}" -> column: ${column}`);
    
    await pool.query(`
      UPDATE event_settings 
      SET ${column} = GREATEST(${column} - 1, 0), updated_at = NOW()
      WHERE id = 1
    `);
    
    console.log(`Successfully reduced ${column} by 1`);
  } catch (error) {
    console.error('Error updating remaining tickets:', error);
  }
};

// Helper function to generate referral codes
const generateReferralCode = () => {
  const words = ['LATEX', 'SILK', 'VELVET', 'LEATHER', 'CHAIN', 'ROPE', 'CANDLE', 'MASK', 'CORSET', 'GLOVE'];
  const word = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${word}${number}`;
};

// 6. Server starten
app.listen(PORT, () => {
  initializeDb();
  console.log(`Backend server running on http://localhost:${PORT}`)
});
