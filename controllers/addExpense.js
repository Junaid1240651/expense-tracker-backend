const addExpense = require("../models/addExpense");
const SignUp = require("../models/signup");
const { Op } = require("sequelize");
const { literal } = require("sequelize");

const sequelize = require("../dbConnection/database");
const { BlobServiceClient } = require("@azure/storage-blob");
const AWS = require("aws-sdk");

// Add an expense for the authenticated user
exports.addExpense = async (req, res) => {
  const { expenseAmount, expenseDescription, expenseCategory } = req.body;

  try {
    await sequelize.transaction(async (t) => {
      // Create a new expense record
      await addExpense.create(
        {
          signUpId: req.user.id,
          expenseAmount,
          expenseDescription,
          expenseCategory,
        },
        { transaction: t }
      );

      // Update the user's totalExpense
      await req.user.update(
        {
          totalExpense: req.user.totalExpense + Number(expenseAmount),
        },
        { transaction: t }
      );

      res.status(201).send("Expense added successfully");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");

    t.rollback();
  }
};
// Get expenses for the authenticated user with pagination
exports.getExpense = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    // Retrieve expenses with pagination
    const expenses = await req.user.getAddExpenses({
      offset,
      limit: parseInt(pageSize, 10),
    });

    res.status(201).send(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Delete an expense for the authenticated user
exports.deleteExpense = async (req, res) => {
  const id = req.params.id;
  const deleteAmount = req.body.amount;

  try {
    await sequelize.transaction(async (t) => {
      // Update the user's totalExpense
      await req.user.update(
        {
          totalExpense: req.user.totalExpense - Number(deleteAmount),
        },
        { transaction: t }
      );
      // Delete the expense
      await addExpense.destroy({
        where: { id, signUpId: req.user.id },
        transaction: t,
      });

      res.status(201).send("Deleted Successfully");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
    t.rollback();
  }
};

// Update an expense for the authenticated user
exports.updateExpense = async (req, res) => {
  const id = req.params.id;
  const { expenseAmount, expenseDescription, expenseCategory } = req.body;

  try {
    await sequelize.transaction(async (t) => {
      // Update the user's totalExpense directly in the database
      const expenseToUpdate = await addExpense.findOne({
        where: { id, signUpId: req.user.id },
        transaction: t,
      });
      if (!expenseToUpdate) {
        return res.status(404).send("Expense not found");
      }

      // Calculate the difference in expenseAmount
      const amountDifference =
        Number(expenseAmount) - expenseToUpdate.expenseAmount;

      // Update the user's totalExpense
      await req.user.update(
        {
          totalExpense: req.user.totalExpense + amountDifference,
        },
        { transaction: t }
      );
      // Update the expense details
      expenseToUpdate.expenseAmount = expenseAmount;
      expenseToUpdate.expenseDescription = expenseDescription;
      expenseToUpdate.expenseCategory = expenseCategory;

      // Save the changes
      await expenseToUpdate.save({ transaction: t });

      res.status(201).send("Expense Updated Successfully");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
    // Rollback the transaction in case of an error
    if (t) {
      await t.rollback();
    }
  }
};

// Get a leaderboard of users based on their totalExpense
exports.leaderboard = async (req, res) => {
  try {
    // Retrieve user names and totalExpense for leaderboard
    const result = await SignUp.findAll({
      attributes: ["name", "totalExpense"],
    });
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

const BUCKET_NAME = process.env.BUCKET_NAME;
const IM_USER_KEY = process.env.IM_USER_KEY;
const IM_USER_SECRET = process.env.IM_USER_SECRET;

const s3bucket = new AWS.S3({
  accessKeyId: IM_USER_KEY,
  secretAccessKey: IM_USER_SECRET,
});

const uploadToS3 = async (data, file) => {
  // await createBucketIfNotExists();

  const params = {
    Bucket: BUCKET_NAME,
    Key: file,
    Body: data,
    ACL: "public-read",
  };

  try {
    const s3response = await s3bucket.upload(params).promise();
    return s3response.Location;
  } catch (err) {
    console.error(err);
    throw err; // Rethrow the error to be caught by the calling function
  }
};

// Download expenses for the authenticated user based on date range
exports.downloadExpenses = async (req, res) => {
  const currentDate = new Date().toISOString().split("T")[0];
  console.log(currentDate);
  const monthlyDate = req.body.monthlyDate;
  try {
    if (monthlyDate === null) {
      // Download expenses for the current day
      const expenses = await req.user.getAddExpenses({
        where: {
          createdAt: {
            [Op.gte]: literal(`'${currentDate}'`),
            [Op.lt]: literal(
              `'${
                new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
              }'`
            ),
          },
        },
      });

      // Convert expenses to JSON string
      const stringFieldExpense = JSON.stringify(expenses);

      // Generate a unique file name
      const fileName = `Expense${req.user.id}/${new Date()}.txt`;

      // Upload the file to S3 and get the file URL
      const fileURL = await uploadToS3(stringFieldExpense, fileName);
      res.status(201).send(fileURL);
    } else {
      // Download expenses for the specified month
      const expenses = await req.user.getAddExpenses({
        where: {
          createdAt: {
            [Op.gte]: `${monthlyDate}-01`, // Start of the month
            [Op.lt]: `${
              new Date(
                new Date(`${monthlyDate}-01`).getTime() +
                  32 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split("T")[0]
            }`, // Start of the next month
          },
        },
      });
      // Convert expenses to JSON string
      const stringFieldExpense = JSON.stringify(expenses);

      // Generate a unique file name
      const fileName = `Expense${req.user.id}/${new Date()}.txt`;

      // Upload the file to S3 and get the file URL
      const fileURL = await uploadToS3(stringFieldExpense, fileName);

      res.status(201).send(fileURL);
    }
  } catch (err) {
    res.status(500).json({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

// Generate a daily expense report for the authenticated user
exports.generateDailyReport = async (req, res) => {
  const currentDate = new Date().toISOString().split("T")[0];
  console.log(currentDate);
  try {
    // Retrieve expenses for the current day
    const expenses = await req.user.getAddExpenses({
      where: {
        createdAt: {
          [Op.gte]: literal(`'${currentDate}'`),
          [Op.lt]: literal(
            `'${
              new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }'`
          ),
        },
      },
    });

    res.status(200).json({
      success: true,
      expenses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

// Generate a monthly expense report for the authenticated user
exports.generateMonthlyReport = async (req, res) => {
  const monthlyDate = req.body.monthlyDate;

  try {
    // Retrieve expenses for the specified month
    const expenses = await req.user.getAddExpenses({
      where: {
        createdAt: {
          [Op.gte]: `${monthlyDate}-01`, // Start of the month
          [Op.lt]: `${
            new Date(
              new Date(`${monthlyDate}-01`).getTime() + 32 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0]
          }`, // Start of the next month
        },
      },
    });

    res.status(200).json({
      success: true,
      expenses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};
