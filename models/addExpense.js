const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../dbConnection/database");

const addExpense = sequelize.define("addExpense", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  expenseAmount: DataTypes.STRING,
  expenseDescription: {
    type: DataTypes.STRING,
  },
  expenseCategory: DataTypes.STRING,
});

module.exports = addExpense;
