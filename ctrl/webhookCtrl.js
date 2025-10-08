// server/controllers/webhookController.js - The webhook verifies Stripe signatures and creates a Purchase when a PaymentIntent succeeds. The payment metadata (like packageId) should be set when you create the PaymentIntent on your server.
const Purchase = require("../models/Purchase");
//Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const keyCheck = {
  sandbox: process.env.STRIPE_SECRET_KEY
}

//Docs - Webhook
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function handleStripeWebhook(req, res, stripe) {
  const signature = req.headers["stripe-signature"];
  // let event = req.body; //basic
  let event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    endpointSecret
  );

  const context = event.context;
  if (!context) {
    console.error('Missing context in event');
    return res.status(400).send('Missing context');
  };

  const apiKey = keyCheck[context];
  if (!apiKey) {
    console.error(`No API key found for context: ${context}`);
    return res.status(400).send('Unknown context');
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "payment_intent.succeeded") {
    console.log("Payment success check");
    // TODO: handle successful payment: save to DB, send email, etc.
    }
    res.status(200).json({ received: true });

  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event - test in the CLI
  switch (event.type) {
    //init
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Create or upsert (a database operation that inserts a new record if it doesn't exist or updates an existing record if it does) a Purchase record
      try {
        await Purchase.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            packageId: (paymentIntent.metadata && paymentIntent.metadata.packageId) || "unknown",
            amount: paymentIntent.amount_received || paymentIntent.amount,
            currency: paymentIntent.currency,
            stripePaymentIntentId: paymentIntent.id,
            customerEmail: (paymentIntent.receipt_email || (paymentIntent.charges?.data?.[0]?.billing_details?.email)),
            metadata: paymentIntent.metadata || {}
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Error saving purchase:", err);
      }
      break;
    }
    //org settings
    case 'customer.created': {
      const customer = event.data.object;
      const latestCustomer = await stripe.customers.retrieve(customer.id);
      handleCustomerCreated(latestCustomer, context);
      break;
    }
    case 'payment_method.attached': {
      const paymentMethod = event.data.object;
      const latestPaymentMethod = await stripe.paymentMethods.retrieve(paymentMethod.id);
      handlePaymentMethodAttached(latestPaymentMethod, context);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a res to acknowledge receipt of the event
  res.json({ received: true });
  } catch (err) {
    console.error(`Error processing event: ${err.message}`);
    res.status(500).send('Internal error');
    //Err handling test
    switch (err.type) {
  case 'StripeCardError':
    // A declined card error
    err.message; // => e.g. "Your card's expiration year is invalid."
    break;
  case 'StripeRateLimitError':
    // Too many requests made to the API too quickly
    break;
  case 'StripeInvalidRequestError':
    // Invalid parameters were supplied to Stripe's API
    break;
  case 'StripeAPIError':
    // An error occurred internally with Stripe's API
    break;
  case 'StripeConnectionError':
    // Some kind of error occurred during the HTTPS communication
    break;
  case 'StripeAuthenticationError':
    // You probably used an incorrect API key
    break;
  default:
    // Handle any other types of unexpected errors
    break;
}
  }
  
}

module.exports = { handleStripeWebhook };
