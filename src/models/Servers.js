const { DataTypes } = require("sequelize");
const sequelize = require('../config/connectDB');

const Server = sequelize.define(
  "server",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id_fk: { type: DataTypes.STRING, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: true },
    plan: { type: DataTypes.STRING, allowNull: true },
    min_max: { type: DataTypes.STRING, allowNull: true },
    invest_amount: { type: DataTypes.INTEGER, allowNull: true },
    period: { type: DataTypes.INTEGER, allowNull: true },
    period_end: { type: DataTypes.INTEGER, allowNull: true,},
    days: { type: DataTypes.INTEGER, allowNull: true,},
  },
  {
    tableName: "servers",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Server;
