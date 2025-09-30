// 1. Abhängigkeiten importieren
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config(); // Lädt Umgebungsvariablen aus der .env-Datei

// 2. Initialisierung
const app = express();
const PORT = 4242; // Port, auf dem unser Backend laufen wird

// Stripe-Konfiguration
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal-Konfiguration
// TODO: Der Benutzer muss das SDK installieren: npm install @paypal/checkout-server-sdk
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
app.use(express.json());

// 4. Hilfsfunktionen
const calculateOrderAmount = (priceString) => {
  if (!priceString) return 0;
  const priceNumber = parseFloat(priceString.replace(/€|\s/g, '').replace('.', ''));
  return priceNumber * 100; // In Cent für Stripe
};

// 5. API-Routen

// Stripe-Route
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { price } = req.body;
    if (!price) {
      return res.status(400).send({ error: 'Price is required' });
    }
    const amount = calculateOrderAmount(price);
    if (amount <= 0) {
      return res.status(400).send({ error: 'Invalid price provided' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
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
  const { orderID } = req.body;
  if (!orderID) {
    return res.status(400).send({ error: 'Order ID is required' });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    // Hier können Sie die Transaktionsdetails in Ihrer Datenbank speichern.
    // z.B. if (capture.result.status === 'COMPLETED') { ... }
    res.json({ status: 'success', capture });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to capture PayPal payment.' });
  }
});

// 6. Server starten
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
