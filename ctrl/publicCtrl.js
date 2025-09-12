// server/controllers/publicController.js
const Purchase = require("../models/Purchase");
const Booking = require("../models/Booking");

// Called by frontend after payment success to book a session
async function bookSession(req, res) {
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

module.exports = { bookSession };
