const subscription = require("../models/subscription");
const Razorpay = require("razorpay");
const SignUp = require("../models/signup");
const sequelize = require("../dbConnection/database");

// Handle subscription creation and Razorpay order creation
exports.subscription = (req, res) => {
  try {
    // Create a new instance of Razorpay with API credentials
    var instance = new Razorpay({
      key_id: process.env.Razorpay_key_id,
      key_secret: process.env.Razorpay_key_secret,
    });
    // Set options for Razorpay order creation
    const options = {
      amount: 5000,
      currency: "INR",
      receipt: "jk1240651@gmail.com",
    };

    // Create a Razorpay order
    instance.orders.create(options, async (err, order) => {
      if (err) {
        console.log(err);
      }

      // Create a subscription record in the database
      await subscription
        .create({
          orderId: order.id,
          status: "pending",
          signUpId: req.user.id,
        })
        .then((response) => {
          // Return Razorpay order details and key_id
          return res
            .status(201)
            .json({ order, key_id: instance.key_id, response });
        });
    });
  } catch (error) {
    console.log(error);
  }
};

// Handle subscription status update based on Razorpay payment confirmation
exports.subscriptionStatusUpdate = async (req, res) => {
  const { id, orderId, paymentId, status } = req.body;

  try {
    await sequelize.transaction(async (t) => {
      // Find the subscription record
      const subscriptionRecord = await subscription.findOne({
        where: { id, signUpId: req.user.id },
        transaction: t,
      });

      if (!subscriptionRecord) {
        return res.status(404).send("Subscription not found");
      }

      // Update subscription details based on payment status
      if (status !== "failed") {
        subscriptionRecord.orderId = orderId;
        subscriptionRecord.status = status;
        subscriptionRecord.paymentId = paymentId;
        await subscriptionRecord.save({ transaction: t });

        // Update user's premium status
        const userRecord = await SignUp.findOne({
          where: { id: req.user.id },
          transaction: t,
        });

        if (userRecord) {
          userRecord.isPremiumUser = true;
          await userRecord.save({ transaction: t });
        }
      } else {
        subscriptionRecord.status = status;
        await subscriptionRecord.save({ transaction: t });
      }

      res.status(201).send("Payment Update Successfully");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
