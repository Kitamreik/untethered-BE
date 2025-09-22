// server/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const { bookSession, createPaymentIntent, logSession, cancelSession, createIntake, getIntakes } = require("../ctrl/publicCtrl");

//Quick Check
router.get("/", (req, res) => res.json({ status: 200 }));

//FE Form - must be public for data transmission
router.post("/intake", createIntake);
router.get("/intake", getIntakes);

//Stripe
router.post("/book-session", bookSession);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/log-session", logSession);
router.post("/cancel-payment-intent", cancelSession);


module.exports = router;
