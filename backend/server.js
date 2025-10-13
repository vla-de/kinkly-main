// 1. Abhängigkeiten importieren
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
import { Pool } from 'pg'; // Import the pg Pool class directly

// E-Mail-Versand mit Resend
import { Resend } from 'resend';

dotenv.config();

// 2. Initialisierung
const app = express();
const PORT = process.env.PORT || 4242;

// E-Mail-Client-Initialisierung
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'Kinkly Berlin <no-reply@kinkly.eu>';

// E-Mail-Hilfsfunktionen
const sendEmail = async (to, subject, html, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
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

const sendEventInviteEmail = async (email, firstName, lastName, referralCode) => {
  const eventUrl = referralCode 
    ? `https://kinkly-main.vercel.app/event?serpentToken=${referralCode}`
    : 'https://kinkly-main.vercel.app/event';
  
  const subject = 'Your Invitation to Kinkly Berlin';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 20px;">
      <h1 style="color: #fff; text-align: center; margin-bottom: 30px;">Kinkly Berlin</h1>
      
      <p>Dear ${firstName} ${lastName},</p>
      
      <p>You have been invited to join our exclusive event. The invitation awaits you.</p>
      
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
    
    Click here to enter: ${eventUrl}
    
    This is an exclusive invitation. Please do not share this link.
  `;
  
  return await sendEmail(email, subject, html, text);
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
app.use(cors({ origin: '*' }));

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
app.post('/api/applications', async (req, res) => {
  const { firstName, lastName, email, message, tier, referralCodeId } = req.body;
  if (!firstName || !lastName || !email || !tier) {
    return res.status(400).json({ error: 'First name, last name, email, and tier are required.' });
  }
  try {
    if (!pool) {
      throw new Error('Database is not configured. Set DATABASE_URL in environment.');
    }
    const result = await pool.query(
      'INSERT INTO applications (first_name, last_name, email, message, tier, referral_code_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [firstName, lastName, email, message || null, tier, referralCodeId || null]
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

      // Update remaining tickets
      await updateRemainingTickets(tier);

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
        CASE WHEN rc.user_id IS NOT NULL THEN true ELSE false END as is_referrer,
        COUNT(rc2.id) as referral_count
      FROM applications a
      LEFT JOIN referral_codes rc ON a.id = rc.user_id
      LEFT JOIN referral_codes rc2 ON rc2.user_id = a.id
      GROUP BY a.id, a.first_name, a.last_name, a.email, a.message, a.tier, a.status, a.created_at, rc.user_id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  const { firstName, lastName, email, message, tier } = req.body;
  
  if (!firstName || !lastName || !email || !tier) {
    return res.status(400).json({ error: 'First name, last name, email, and tier are required' });
  }
  
  try {
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

// Send event invite to waitlist person
app.post('/api/admin/send-invite', authenticateAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, referralCode } = req.body;
    
    console.log('Sending invite to:', { email, firstName, lastName, referralCode });
    
    // Send email using Resend
    const emailResult = await sendEventInviteEmail(email, firstName, lastName, referralCode);
    
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
        COUNT(CASE WHEN status = 'pending_payment' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM applications a
      LEFT JOIN payments p ON a.id = p.application_id
    `);
    
    console.log('Applications stats:', stats.rows[0]);
    
    // Get sold tickets by tier
    const soldTickets = await pool.query(`
      SELECT 
        COUNT(CASE WHEN tier = 'The Invitation' THEN 1 END) as invitation_sold,
        COUNT(CASE WHEN tier = 'The Circle' THEN 1 END) as circle_sold,
        COUNT(CASE WHEN tier = 'The Inner Sanctum' THEN 1 END) as sanctum_sold
      FROM applications 
      WHERE status IN ('pending_review', 'approved')
    `);
    
    console.log('Sold tickets:', soldTickets.rows[0]);
    
    const scarcity = await pool.query(`
      SELECT invitation_tickets, circle_tickets, sanctum_tickets FROM event_settings WHERE id = 1
    `);
    
    console.log('Scarcity settings:', scarcity.rows[0]);
    
    const result = {
      ...stats.rows[0],
      // Available tickets (total - sold)
      invitation_tickets: (scarcity.rows[0]?.invitation_tickets || 20) - (soldTickets.rows[0]?.invitation_sold || 0),
      circle_tickets: (scarcity.rows[0]?.circle_tickets || 15) - (soldTickets.rows[0]?.circle_sold || 0),
      sanctum_tickets: (scarcity.rows[0]?.sanctum_tickets || 10) - (soldTickets.rows[0]?.sanctum_sold || 0),
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

// Serpent token validation endpoint
app.post('/api/auth/validate-code', async (req, res) => {
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
      return res.status(400).json({ error: 'Der Serpent Token passt nicht.' });
    }
    
    const referralCode = result.rows[0];
    
    // Check if this IP/session has already used this code
    const usageCheck = await pool.query(`
      SELECT id FROM referral_code_usage 
      WHERE referral_code_id = $1 AND (ip_address = $2 OR session_id = $3)
    `, [referralCode.id, clientIP, sessionId]);
    
    if (usageCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Dieser Serpent Token wurde bereits von dieser Session verwendet.' });
    }
    
    // Record this usage attempt (but don't increment used_count yet)
    await pool.query(`
      INSERT INTO referral_code_usage (referral_code_id, ip_address, user_agent, session_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (referral_code_id, ip_address, session_id) DO NOTHING
    `, [referralCode.id, clientIP, userAgent, sessionId]);
    
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
app.post('/api/waitlist', async (req, res) => {
  console.log('Waitlist API called with:', req.body);
  
  const { firstName, lastName, email, referralCode } = req.body;
  
  if (!firstName || !lastName || !email) {
    console.log('Validation failed:', { firstName, lastName, email });
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }
  
  if (!pool) {
    console.error('Database pool not available');
    return res.status(500).json({ error: 'Database not available' });
  }
  
  try {
    console.log('Inserting into waitlist:', { firstName, lastName, email, referralCode });
    
    const result = await pool.query(`
      INSERT INTO waitlist (first_name, last_name, email, referral_code) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        referral_code = EXCLUDED.referral_code
      RETURNING *
    `, [firstName, lastName, email, referralCode || null]);
    
    console.log('Waitlist entry created/updated:', result.rows[0]);
    
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
    let column = 'invitation_tickets'; // default
    if (tier === 'The Circle') column = 'circle_tickets';
    else if (tier === 'The Inner Sanctum') column = 'sanctum_tickets';
    
    await pool.query(`
      UPDATE event_settings 
      SET ${column} = GREATEST(${column} - 1, 0), updated_at = NOW()
      WHERE id = 1
    `);
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
