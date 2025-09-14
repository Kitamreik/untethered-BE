// server/controllers/publicController.js
const Purchase = require("../models/Purchase");
const Booking = require("../models/Booking");
const Intake = require ("../models/Intake.js");

//Intake Log Form from FE
async function createIntake(req, res, next) {
  try {
    const intake = await Intake.create(req.body);
    res.json(intake);
  } catch (err) {
    res.status(500).json({ error: "Failed to save intake" });
  }
}

async function getIntakes(req, res, next) {
  try {
    const intakes = await Intake.find().sort({ createdAt: -1 });
    res.json(intakes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch intakes" });
  }
}

// Called by frontend after payment success to book a session
async function bookSession(req, res, next) {
  try {
    const { packageId, sessionDate, purchaserEmail, stripePaymentIntentId } = req.body;
    // Try to find matching Purchase (logged by webhook)
    let purchase = null;
    if (stripePaymentIntentId) {
      purchase = await Purchase.findOne({ stripePaymentIntentId });
    }

    // If purchase not found, create a minimal record (webhook may be delayed)
    if (!purchase) {
      purchase = await Purchase.create({
        packageId,
        amount: 0,
        currency: "usd",
        stripePaymentIntentId: stripePaymentIntentId || "unknown",
        customerEmail: purchaserEmail,
        status: "unknown"
      });
    }

    const booking = await Booking.create({
      packageId,
      purchaseId: purchase._id,
      sessionDate: new Date(sessionDate),
      purchaserEmail: purchaserEmail
    });

    res.json({ status: "ok", booking });
  } catch (err) {
    console.error("bookSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function createPaymentIntent(req, res, next) {
  try {
    const { packageId, price, purchaserEmail } = req.body;

    if (!packageId || !price) {
      return res.status(400).json({ error: "Missing packageId or price" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: "usd",
      metadata: { packageId, purchaserEmail },
      receipt_email: purchaserEmail,
    });

    const purchase = await Purchase.create({
      packageId,
      amount: price,
      currency: "usd",
      stripePaymentIntentId: paymentIntent.id,
      customerEmail: purchaserEmail,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ clientSecret: paymentIntent.client_secret, purchase });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function logSession(req, res, next) {
  try {
    const { packageId, stripePaymentIntentId, purchaserEmail } = req.body;

    if (!packageId || !stripePaymentIntentId) {
      return res.status(400).json({ error: "Missing packageId or stripePaymentIntentId" });
    }

    const purchase = await Purchase.findOneAndUpdate(
      { stripePaymentIntentId },
      { status: "paid", updatedAt: new Date() },
      { new: true }
    );

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const booking = await Booking.create({
      packageId,
      purchaseId: purchase._id,
      purchaserEmail,
      status: "unbooked",
      createdAt: new Date(),
    });

    res.json({ status: "ok", booking });
  } catch (err) {
    console.error("logSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function cancelSession(req, res, next) {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Missing paymentIntentId" });
    }

    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    await Purchase.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: "canceled", updatedAt: new Date() }
    );

    res.json({ status: "ok", canceledIntent });
  } catch (err) {
    console.error("cancelSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { bookSession, createPaymentIntent, logSession, cancelSession, createIntake, getIntakes };
