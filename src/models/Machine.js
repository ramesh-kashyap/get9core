const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Machine = sequelize.define(
  "machines",
  {
    m_id:     { type: DataTypes.INTEGER, primaryKey: true },
    m_name:   { type: DataTypes.STRING,  allowNull: false },
    m_return: { type: DataTypes.DECIMAL(10,4), allowNull: false },
    trade: { type: DataTypes.INET, allowNull: true },
  },
  {
    tableName: "machines",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Machine;
