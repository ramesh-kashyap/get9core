const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');

const Withdraw = sequelize.define('Withdraw', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    user_id_fk: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.FLOAT, allowNull: true },
    charge: { type: DataTypes.FLOAT, allowNull: true },
    payable_amt: { type: DataTypes.FLOAT, allowNull: true },
    txn_id: { type: DataTypes.STRING, allowNull: true },
    remarks: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('Approved', 'Pending', 'Rejected'), defaultValue: 'Pending' },
    payment_mode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    account: {
        type: DataTypes.STRING,
        allowNull: true,
    },
   
    wdate: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'withdraws',
    timestamps: false
});

module.exports = Withdraw;