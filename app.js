require('dotenv').config();
require('./config/connection'); 
const express = require("express");
// const session = require("express-session");
// const passport = require("passport");

const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("node:path");

//Email Automation
const { startAgenda } = require("./utils/agenda");

const app = express();
const PORT = process.env.PORT || 8080;
//Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

//Internal check - shut down process if no key access
if (!ADMIN_API_KEY) {
  console.error("ADMIN_API_KEY is missing from environment!");
  process.exit(1);
}

// --- Mock DB (replace with MongoDB/Firebase) ---
let sessions = [];
let purchases = [];

//Routers
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const { handleStripeWebhook } = require("./Ctrl/webhookCtrl");
//Testing Stripe API
const testStripe = require("./routes/tests");

//Webhook: Route gets raw body, mount before express.json()
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res, next) => 
      handleStripeWebhook(req, res, next, stripe)
);

//Testing Webhook:
/*
 1. Test at localhost:PORT/webhook
 2. CLI - stripe login
 3. Enter --> complete auth process
 4. forward snapshot events to your local listener --> stripe listen --forward-to localhost:4242
  5. Event tracking from controller: stripe listen --events payment_intent.succeeded,customer.created,payment_method.attached --forward-to localhost:4242 
  6. To check webhook signatures, use the {{WEBHOOK_SIGNING_SECRET}} from the initial output of the listen command.
  7. Trigger Test Events: stripe trigger (event name)
  ---
 ... stripe products create \ (information: --name="", etc)
  8. Look for the product identifier (in id) in the response object. In env: Please note: this key will expire after 90 days, at which point you'll need to re-authenticate.
*/

app.use(helmet()); 
app.use(morgan("combined")); 
app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json()); 
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


//Route used in app
//Testing stripe...
app.use("/", testStripe);

//When Stripe established...
//app.use("/api", publicRoutes); //Success, bookSession, createPaymentIntent, logSession, cancelSession
//---
app.use("/api/admin", adminRoutes);  //Success, getPurchases, getBookings, updateBookingStatus, adminSummary, createIntake, getIntakes, deleteIntakes  


//Err handling middleware
app.use((err, req, res, next) => {
    if (err.code === 11000) {
      return res.status(err.status || 400).json({
        error: { message: "Already have an account? Try logging in." },
        statusCode: err.status || 400,
      });
    }
  
    return res.status(err.status || 500).json({
      error: { message: err.message || "Internal server error." },
      statusCode: err.status || 500,
    });
});
  
app.listen(PORT, () => {
console.log(
    `Server is listening on port ${PORT}. Use http://localhost:${PORT}/`
);
});