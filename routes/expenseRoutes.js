const express = require("express");
const expenseRoutes = express.Router();
const { verifyToken } = require("../jwtToken/jwtToken");

const expense = require("../controllers/addExpense");

expenseRoutes.post("/expense/addexpense", verifyToken, expense.addExpense);
expenseRoutes.get("/getexpense", verifyToken, expense.getExpense);
expenseRoutes.post("/delete/:id", verifyToken, expense.deleteExpense);
expenseRoutes.put("/update/:id", verifyToken, expense.updateExpense);

expenseRoutes.post("/leaderboard", verifyToken, expense.leaderboard);

expenseRoutes.post("/download", verifyToken, expense.downloadExpenses);
expenseRoutes.post(
  "/generateDailyReport",
  verifyToken,
  expense.generateDailyReport
);
expenseRoutes.post(
  "/generateMonthlyReport",
  verifyToken,
  expense.generateMonthlyReport
);

module.exports = expenseRoutes;
