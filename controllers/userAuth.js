const bcrypt = require("bcrypt");
const { generateToken } = require("../jwtToken/jwtToken");
const SignUp = require("../models/signup");

// Handle user signup
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user with the provided email already exists
    const response = await SignUp.findOne({
      where: {
        email: email,
      },
    });
    if (response == null) {
      // Encrypt the password using bcrypt
      encryptedPassword = await bcrypt.hash(password, 10);

      // Create a new user record
      const response = await SignUp.create({
        name: name,
        email: email,
        isPremiumUser: false,
        totalExpense: 0,
        password: encryptedPassword,
      });

      // Generate a JWT token for the user
      const token = generateToken(response);

      // Send the token and user details in the response
      res.send({ token, response });
    } else {
      // If the user already exists, send a 401 status and message
      res.status(401).send("User already exists Please Login");
    }
  } catch (error) {
    console.log(error);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user with the provided email
    const response = await SignUp.findOne({
      where: {
        email: email,
      },
    });

    if (response !== null) {
      // Compare the provided password with the stored hashed password

      if (await bcrypt.compare(password, response.password)) {
        // If the passwords match, generate a JWT token

        const token = generateToken(response);

        // Send the token and user details in the response
        res.send({ token, response });
      } else {
        // If the passwords don't match, send a 401 status and message
        res.status(401).send("Invalid password");
      }
    } else {
      // If the user doesn't exist, send a 401 status and message
      res.status(401).send("User Not Exists Please SignUp");
    }
  } catch (error) {
    console.log(error);
  }
};

// Verify user using the JWT middleware
exports.verifyUser = async (req, res) => {
  // Send the verified user details in the response
  res.status(201).send(req.user);
};
