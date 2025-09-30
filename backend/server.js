// 1. Abhängigkeiten importieren
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
import { Pool } from 'pg'; // Import the pg Pool class directly

// HINWEIS: Für den E-Mail-Versand würden Sie einen Dienst wie Resend hinzufügen.
// import { Resend } from 'resend';

dotenv.config();

// 2. Initialisierung
const app = express();
const PORT = process.env.PORT || 4242;

// E-Mail-Client-Initialisierung (Platzhalter)
// const resend = new Resend(process.env.RESEND_API_KEY);
// const EMAIL_FROM = process.env.EMAIL_FROM || 'Kinkly Berlin <no-reply@kinkly.eu>';


// Database-Konfiguration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render connections
  }
});

// Create tables if they don't exist
const initializeDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT,
        tier VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending_payment',
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
    console.log('Database tables are ready.');
  } catch (err)
{
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

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const applicationId = paymentIntent.metadata.applicationId;

    if (applicationId) {
      try {
        await pool.query('BEGIN');
        await pool.query(
          `INSERT INTO payments (application_id, payment_method, transaction_id, amount, status)
           VALUES ($1, 'Stripe', $2, $3, $4)`,
          [applicationId, paymentIntent.id, paymentIntent.amount, paymentIntent.status]
        );
        const appResult = await pool.query(
          "UPDATE applications SET status = 'pending_review' WHERE id = $1 RETURNING full_name, email, tier",
          [applicationId]
        );
        await pool.query('COMMIT');
        console.log(`Payment for application ${applicationId} recorded.`);
        
        // Send confirmation email
        if (appResult.rows.length > 0) {
            const { full_name, email, tier } = appResult.rows[0];
            await sendConfirmationEmail(full_name, email, tier);
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

const sendConfirmationEmail = async (fullName, email, tier) => {
  console.log(`Sending confirmation email to ${email} for ${tier}.`);
  // EMAIL LOGIC GOES HERE
  /*
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Application to Kinkly Berlin has been received',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Dear ${fullName},</h2>
          <p>Thank you for your application for <strong>${tier}</strong>.</p>
          <p>Your request has been received and is now under review by The Circle. This is not a confirmation of entry.</p>
          <p>If your application is successful, you will receive a separate confirmation with your official invitation and further details.</p>
          <p>If your application is not successful, you will be notified and your payment will be fully refunded.</p>
          <br/>
          <p>Sincerely,</p>
          <p><strong>The Circle at Kinkly</strong></p>
        </div>
      `,
    });
    console.log(`Confirmation email sent successfully to ${email}.`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
  }
  */
};


// 5. API-Routen

// Create a new application
app.post('/api/applications', async (req, res) => {
  const { fullName, email, message, tier } = req.body;
  if (!fullName || !email || !tier) {
    return res.status(400).json({ error: 'Full name, email, and tier are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO applications (full_name, email, message, tier) VALUES ($1, $2, $3, $4) RETURNING id',
      [fullName, email, message || null, tier]
    );
    res.status(201).json({ applicationId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Internal server error.' });
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
        "UPDATE applications SET status = 'pending_review' WHERE id = $1 RETURNING full_name, email, tier",
        [applicationId]
      );
      await pool.query('COMMIT');
      console.log(`PayPal payment for application ${applicationId} recorded.`);

      // Send confirmation email
       if (appResult.rows.length > 0) {
            const { full_name, email, tier } = appResult.rows[0];
            await sendConfirmationEmail(full_name, email, tier);
        }
    }

    res.json({ status: 'success', capture });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).send({ error: 'Failed to capture PayPal payment.' });
  }
});

// 6. Server starten
app.listen(PORT, () => {
  initializeDb();
  console.log(`Backend server running on http://localhost:${PORT}`)
});