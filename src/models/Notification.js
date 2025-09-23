const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Notification = sequelize.define(
  "notifications",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    read_status: { type: DataTypes.INTEGER, allowNull: true },
    message: { type: DataTypes.STRING, allowNull: true },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // today_reward: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    tableName: "notifications",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Notification;
