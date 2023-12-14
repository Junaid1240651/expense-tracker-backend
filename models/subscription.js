const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../dbConnection/database");

const Subscription = sequelize.define("subscription", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  paymentId: DataTypes.STRING,

  orderId: DataTypes.STRING,

  status: DataTypes.STRING,
});

module.exports = Subscription;
