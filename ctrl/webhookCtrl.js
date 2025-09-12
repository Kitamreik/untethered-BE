// server/controllers/webhookController.js - The webhook verifies Stripe signatures and creates a Purchase when a PaymentIntent succeeds. The payment metadata (like packageId) should be set when you create the PaymentIntent on your server.
const Purchase = require("../models/Purchase");

async function handleStripeWebhook(req, res, stripe) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      // Create or upsert a Purchase record
      try {
        await Purchase.findOneAndUpdate(
          { stripePaymentIntentId: pi.id },
          {
            packageId: (pi.metadata && pi.metadata.packageId) || "unknown",
            amount: pi.amount_received || pi.amount,
            currency: pi.currency,
            stripePaymentIntentId: pi.id,
            customerEmail: (pi.receipt_email || (pi.charges?.data?.[0]?.billing_details?.email)),
            metadata: pi.metadata || {}
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error("Error saving purchase:", e);
      }
      break;
    }
    // Add other events you care about
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = { handleStripeWebhook };
