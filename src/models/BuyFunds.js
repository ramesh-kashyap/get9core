const { DataTypes } = require("sequelize");
const sequelize = require('../config/connectDB');

const BuyFund = sequelize.define(
  "buy_funds",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    user_id_fk: { type: DataTypes.STRING, allowNull: true },
    txn_no: { type: DataTypes.STRING, allowNull: true },
    remarks: {type: DataTypes.STRING, allowNull: true},
    amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING, allowNull: true },    
    bdate: { type: DataTypes.DATE, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true},
    orderId: { type: DataTypes.STRING, allowNull: true},
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
  },
  },
  {
    tableName: "buy_funds",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = BuyFund;
