const { DataTypes } = require("sequelize");
const sequelize = require('../config/connectDB');

const BuyFund = sequelize.define(
  "trades",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING, allowNull: true },
    currency: { type: DataTypes.STRING, allowNull: true },
    selectedServer: { type: DataTypes.STRING, allowNull: true },
    period: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    profit: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    insurance: { type: DataTypes.INTEGER, allowNull: true }, 
    status: {
      type: DataTypes.ENUM('Running', 'Pending', 'Completed'),
      allowNull: false
    },
    entrytime: { type: DataTypes.DATE, allowNull: true },   
    endtime: { type: DataTypes.DATE, allowNull: true },  
    plan: { type: DataTypes.INTEGER, allowNull: true },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
  },
  {
    tableName: "trades",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = BuyFund;
