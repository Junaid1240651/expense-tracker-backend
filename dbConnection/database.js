const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.SQLDBPassword,
  {
    dialect: "mysql",
    host: process.env.DBHOST,
  }
);

module.exports = sequelize;
