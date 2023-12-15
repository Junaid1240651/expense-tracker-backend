const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SignUp = require("../models/signup");
const Forgotpassword = require("../models/forgetPassword");
const nodemailer = require("nodemailer");

// Function to handle the forgot password request
exports.forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await SignUp.findOne({ where: { email } });

    if (user) {
      // Check if there is an active token for the user
      const activeForgotPasswordEntry = await Forgotpassword.findOne({
        where: { signUpId: user.id, active: true },
      });

      // If there is an active entry, mark it as inactive
      if (activeForgotPasswordEntry) {
        activeForgotPasswordEntry.active = false;
        await activeForgotPasswordEntry.save();
      }

      // Generate a new token
      const secret = process.env.JWT_SECRET + user.email;
      const token = jwt.sign({ email: user.email, id: user.id }, secret, {
        expiresIn: "5min",
      });

      const link = `http://localhost:3000/resetpassword/${user.id}/${user.email}/${token}`;
      res.send(link);

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "jkj032743@gmail.com",
          pass: process.env.EMAILPASSWORD,
        },
      });

      var mailOptions = {
        from: "jkj032743@gmail.com",
        to: email,
        subject: "Expense Password Forget Link",
        text: link,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          response.status(200).send("Reset Password Link sent to Your Email");
          console.log("Email sent: " + info.response);
        }
      });

      // Create a new Forgotpassword entry with resetToken and resetTokenExpiration
      await Forgotpassword.create({
        signUpId: user.id,
        resetToken: token,
        resetTokenExpiration: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
        active: true,
      });
    } else {
      return res
        .status(404)
        .json({ message: "User doesn't exist", success: false });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// Function to handle the password reset form
exports.resetpassword = async (req, res) => {
  const { email, id, token } = req.params;
  try {
    // Check if the token is active
    const activeForgotPasswordEntry = await Forgotpassword.findOne({
      where: { signUpId: id, resetToken: token, active: true },
    });

    if (!activeForgotPasswordEntry) {
      return res.send("Invalid or expired reset link.");
    }

    const secret = process.env.JWT_SECRET + email;
    const verify = jwt.verify(token, secret);

    // Send the HTML form for password reset
    res.status(200).send(`
      <html>
        <script>
          function formsubmitted(e){
            e.preventDefault();
            console.log('called')
          }
        </script>
        <form action="/resetpassword/${id}/${token}" method="post">
          <label for="newpassword">Enter New password</label>
          <input name="newpassword" type="password" id="password" required></input>
          <button type="submit" value="submit">Reset Password</button>
        </form>
      </html>
    `);
  } catch (error) {
    console.log(error);
    res.send("Not verified");
  }
};

// Function to handle the password reset success
exports.resetpasswordsuccess = async (req, res) => {
  const { id, token } = req.params;
  const newPassword = req.body.newpassword;
  try {
    const user = await SignUp.findOne({ where: { id } });
    if (!user) {
      return res.send("User Does Not Exist");
    }

    // Check if the token is active
    const activeForgotPasswordEntry = await Forgotpassword.findOne({
      where: { signUpId: user.id, resetToken: token, active: true },
    });

    if (!activeForgotPasswordEntry) {
      return res.send("Invalid or expired reset link.");
    }

    const secret = process.env.JWT_SECRET + user.email;
    const verify = jwt.verify(token, secret);

    // Hash the new password and update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Mark the token as inactive after successful password reset
    activeForgotPasswordEntry.active = false;
    await activeForgotPasswordEntry.save();

    res.status(200).send("Password Reset Successful");
  } catch (error) {
    console.log(error);
    res.send("Not verified");
  }
};
