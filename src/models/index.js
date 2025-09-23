
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require('../config/connectDB');
const User = require('./User');
const Investment = require('./Investment');
const Withdraw = require('./Withdraw');
const Income = require('./Income');
const Contract = require('./Contract');
const Variable = require('./Variable');
const Machine = require('./Machine');




sequelize.sync(); // Use { force: true } only if you want to recreate tables

module.exports = { sequelize, User, Investment, Withdraw, Income,Contract,Variable,Machine};
