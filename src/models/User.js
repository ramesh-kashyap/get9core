const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: true },
    userbalance: {type: DataTypes.FLOAT, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: false },
    sponsor: { type: DataTypes.INTEGER, allowNull: true }, // Parent user (sponsor)
    active_status: { type: DataTypes.ENUM('Active', 'Pending'), defaultValue: 'Pending' },
    jdate: { type: DataTypes.DATEONLY },
    adate: { type: DataTypes.DATE , allowNull: true },
    detail_changed_date: { type: DataTypes.DATE , allowNull: true },
    dialCode: { type: DataTypes.STRING, allowNull: true },
    last_trade: {
        type: DataTypes.DATE,
        allowNull: true
    },  
    
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    usdtTrc20: {
        type: DataTypes.STRING,
        allowNull: true,
    },
   
    usdtBep20: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    jdate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,  // Automatically sets the current date
    },
    // user_name: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tpassword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // has_pin: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    PSR: {
        type: DataTypes.STRING,
        allowNull: false
    },
    botActivate: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },

     bot_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    TPSR: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sponsor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ParentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
,
    package: {
        type: DataTypes.DOUBLE(10, 2),  // Double type with 2 decimal places
        allowNull: false,
        defaultValue: 0.00
    }
    // balance: { type: DataTypes.FLOAT, defaultValue: 0 },
}, {
    tableName: 'users',
    timestamps: false
});



module.exports = User;
