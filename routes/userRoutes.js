const express = require("express");
const userRoutes = express.Router();
const { verifyToken } = require("../jwtToken/jwtToken");

const userAuth = require("../controllers/userAuth");
userRoutes.post("/", verifyToken, userAuth.verifyUser);
userRoutes.post("/signup", userAuth.signup);
userRoutes.post("/login", userAuth.login);

module.exports = userRoutes;
