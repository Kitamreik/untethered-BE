const express = require("express");
const router = express.Router();

router.get("/", async (req, res, next) => {
  res.status(200).json({ error: "Stripe API Health check successful" });
})

//Test --> REFACTOR TO ROUTES FOR CLEAN UP
router.post("/create-payment-intent", async (req, res, next) => {
    try {
      const { packageId, price } = req.body;
  
      //Mimic front end 
      const packagePrices = {
        //Supporting Tier
        pkg1: 35000,
        pkg2: 68600,
        pkg3: 100800,
        //Sustaining Tier
        pkg4: 42500,
        pkg5: 83300,
        pkg6: 122400,
        //Impact Tier
        pkg7: 50000,
        pkg8: 98000,
        pkg9: 144000,
      };
  
      const amount = packagePrices[packageId];
      console.log(amount, "amt tracking");
      if (!amount) return res.status(400).json({ error: "Invalid package" });
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price, // price is already passed in cents
        currency: "usd",
        metadata: { packageId },
      });
      console.log("payment generation successful");
  
      res.json({ client_secret: paymentIntent.client_secret, id: paymentIntent.id });
    } catch (err) {
        console.error("Error creating PaymentIntent:", err);
        res.status(500).json({ error: "Failed to create PaymentIntent" });
    }
  });

// --- Route 2: Log Session Purchase ---
router.post("/log-session", (req, res, next) => {
    try {
      //const { packageId } = req.body; //basic
      const { packageId, price, paymentIntentId } = req.body;
  
      purchases.push({
        packageId,
        timestamp: new Date().toISOString(),
      });
  
      res.json({ message: "Session purchase logged", purchases });
    } catch (err) {
      console.error("Error logging session:", err);
      res.status(500).json({ error: "Failed to log session" });
    }
  });
  
  // --- Route 3: Book a Session ---
  router.post("/book-session", (req, res, next) => {
    try {
      const { packageId, sessionDate } = req.body;
  
      sessions.push({
        packageId,
        sessionDate,
        bookedAt: new Date().toISOString(),
      });
  
      res.json({ message: "Session booked", sessions });
    } catch (err) {
      console.error("Error booking session:", err);
      res.status(500).json({ error: "Failed to book session" });
    }
  });
  
  router.post("/cancel-payment-intent", async (req, res, next) => {
    try {
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ error: "PaymentIntent ID required" });
      }
  
      const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  
      res.json({ canceled: true, paymentIntent: canceledIntent });
    } catch (err) {
      console.error("Cancel PaymentIntent error:", err);
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;