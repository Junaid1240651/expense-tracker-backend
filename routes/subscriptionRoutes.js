const express = require("express");
const subscriptionRoutes = express.Router();
const { verifyToken } = require("../jwtToken/jwtToken");

const subscription = require("../controllers/subscription");
subscriptionRoutes.post(
  "/subscription",
  verifyToken,
  subscription.subscription
);
subscriptionRoutes.post(
  "/subscriptionstatusupdate",
  verifyToken,
  subscription.subscriptionStatusUpdate
);

module.exports = subscriptionRoutes;
