const jwt = require("jsonwebtoken");
require("dotenv").config();
const SignUp = require("../models/signup");

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "10h" }); // Token expires in 1 hour
}
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  // console.log(req.headers);
  // console.log(req.headers.authorization);
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET); // Use JWT_SECRET here
    const response = await SignUp.findByPk(user.userId.id);
    req.user = response;

    return next();
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
};

module.exports = { generateToken, verifyToken };
