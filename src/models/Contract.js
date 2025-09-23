const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Contract = sequelize.define(
  "contract",
  {
     id:         { type: DataTypes.INTEGER,    primaryKey: true, autoIncrement: true },
    user_id:    { type: DataTypes.INTEGER,    allowNull: false },
    trade:      { type: DataTypes.STRING,     allowNull: false },
    c_bot:      { type: DataTypes.STRING,     allowNull: false },
    c_buy:      { type: DataTypes.DECIMAL(18,8), allowNull: false },
    c_sell:     { type: DataTypes.DECIMAL(18,8), allowNull: false },
    qty:        { type: DataTypes.DECIMAL(18,8), allowNull: false },
    profit:     { type: DataTypes.DECIMAL(18,8), allowNull: false },
    c_name:     { type: DataTypes.STRING,     allowNull: false },
    c_status:   { type: DataTypes.INTEGER,    allowNull: false },
    c_ref:      { type: DataTypes.DECIMAL(18,8), allowNull: true },
    created_at: { type: DataTypes.DATE,       allowNull: false },
    ttime:      { type: DataTypes.DATE,       allowNull: false }
  },
  {
    tableName: "contract",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Contract;

