require("dotenv").config();

// Importing necessary modules
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const fs = require("fs");
const helmet = require("helmet");

// Logging HTTP requests to a file
const morgan = require("morgan");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Create a write stream for logging access to a file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));

// Importing application routes
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const forgetPasswordRoutes = require("./routes/forgetPasswordRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

app.use(userRoutes);
app.use(subscriptionRoutes);
app.use(forgetPasswordRoutes);
app.use(expenseRoutes);

const sequelize = require("./dbConnection/database");
const Signup = require("./models/signup");
const addExpense = require("./models/addExpense");
const Subscription = require("./models/subscription");
const Forgotpassword = require("./models/forgetPassword");

Signup.hasMany(addExpense);
addExpense.belongsTo(Signup);

Signup.hasMany(Forgotpassword);
Forgotpassword.belongsTo(Signup);

Signup.hasMany(Subscription);
Subscription.belongsTo(Signup);

// Synchronize the database with the defined models
sequelize
  .sync()
  .then((response) => {
    // console.log(response);
  })
  .catch((err) => {
    console.log(err);
  });

// Start the server and listen on the specified port
app.listen(process.env.PORT || 3000, () => {
  console.log("listening on port 3000");
});
