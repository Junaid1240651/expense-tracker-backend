const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../dbConnection/database");

const SignUp = sequelize.define("signUp", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isPremiumUser: DataTypes.BOOLEAN,
  totalExpense: DataTypes.INTEGER,
});

module.exports = SignUp;
