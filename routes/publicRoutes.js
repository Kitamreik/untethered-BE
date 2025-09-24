// server/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const { bookSession, createPaymentIntent, logSession, cancelSession } = require("../ctrl/publicCtrl");

//Quick Check
router.get("/", (req, res) => res.json({ status: 200 }));

//Stripe
router.post("/book-session", bookSession);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/log-session", logSession);
router.post("/cancel-payment-intent", cancelSession);


module.exports = router;
