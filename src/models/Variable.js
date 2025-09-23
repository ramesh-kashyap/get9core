const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Variable = sequelize.define(
  "variables",
  {
    v_id:         { type: DataTypes.INTEGER, primaryKey: true },
    trade_index:  { type: DataTypes.INTEGER, defaultValue: 0 },
    trade_index4: { type: DataTypes.INTEGER, defaultValue: 0 },
    v_index:      { type: DataTypes.INTEGER, defaultValue: 0 }
    // today_reward: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    tableName: "variables",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Variable;
