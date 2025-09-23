const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Machines = sequelize.define(
  "Machines",
  {
    m_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    m_name: { type: DataTypes.STRING, allowNull: false },
    m_amt: { type: DataTypes.INTEGER, allowNull: true },
    m_return: { type: DataTypes.INTEGER, allowNull: true },
    Fees: { type: DataTypes.INTEGER, allowNull: true },
    m_desc: { type: DataTypes.STRING, allowNull: false,},
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // today_reward: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    tableName: "Machines",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Machines;
