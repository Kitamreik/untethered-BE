require('dotenv').config();
//assume we don't need database connection just yet... firebase?
//require('./config/authStrategy'); //needed?
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const passport = require("passport");

const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 8080;
//Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
//Upgrade
/*
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
*/

//Routers
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const { handleStripeWebhook } = require("./Ctrl/webhookCtrl");

//Route gets raw body, mount before express.json()
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    (req, res) => handleStripeWebhook(req, res, stripe)
  );

app.use(helmet()); 
app.use(morgan("combined")); 
app.use(cors({ credentials: true, origin: true })); 
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

//if Google integration
/*
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
*/

// --- Mock DB (replace with MongoDB/Firebase) ---
let sessions = [];
let purchases = [];

//Route used in app
//stripe
app.use("/api/admin", adminRoutes);       // protected admin endpoints
app.use("/api", publicRoutes);            // public endpoints (book-session, etc.)

app.use((err, req, res, next) => {
    // if (err.code === 11000) {
    //   return res.status(err.status || 400).json({
    //     error: { message: "Already have an account? Try logging in." },
    //     statusCode: err.status || 400,
    //   });
    // }
  
    return res.status(err.status || 500).json({
      error: { message: err.message || "Internal server error." },
      statusCode: err.status || 500,
    });
});
  
app.get("/", (req, res, next) => {
res
    .status(200)
    .json({ success: { message: "This route points to the Home page" } });
});

//Test
app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { packageId, price } = req.body;
  
      const packagePrices = {
        pkg1: 5000,
        pkg2: 22500,
        pkg3: 40000,
      };
  
      const amount = packagePrices[packageId];
      if (!amount) return res.status(400).json({ error: "Invalid package" });
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price, // price is already passed in cents
        currency: "usd",
        metadata: { packageId },
      });
  
      res.json({ client_secret: paymentIntent.client_secret });
    } catch (err) {
        console.error("Error creating PaymentIntent:", err);
        res.status(500).json({ error: "Failed to create PaymentIntent" });
    }
  });

// --- Route 2: Log Session Purchase ---
app.post("/api/log-session", (req, res) => {
    try {
      const { packageId } = req.body;
  
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
  app.post("/api/book-session", (req, res) => {
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
  

/*
Frontend-Backend Flow

User selects a package.

CheckoutForm calls /api/create-payment-intent → Stripe PaymentIntent.

Stripe handles card securely on the frontend.

Payment success triggers /api/log-session.

User selects a session date → /api/book-session.
*/

//DB connection re: MongoDB
/*
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
*/
  
app.listen(PORT, () => {
console.log(
    `Server is listening on port ${PORT}. Use http://localhost:${PORT}/`
);
});