const express = require("express");
const forgetPasswordRoutes = express.Router();

const forgetPassword = require("../controllers/resetPassword");

forgetPasswordRoutes.post("/forgotpassword", forgetPassword.forgotpassword);
forgetPasswordRoutes.get(
  "/resetpassword/:id/:email/:token",
  forgetPassword.resetpassword
);
forgetPasswordRoutes.post(
  "/resetpassword/:id/:token",
  forgetPassword.resetpasswordsuccess
);

module.exports = forgetPasswordRoutes;
