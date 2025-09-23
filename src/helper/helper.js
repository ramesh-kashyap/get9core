const Income = require('../models/Income');
const Withdraw = require('../models/Withdraw');
const Investment = require('../models/Investment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const BuyFund = require('../models/BuyFunds');
const Trade = require('../models/Trade');
const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authMiddleware');


const addNotification = async (userId, title, message) => {
  try {
    await Notification.create({
      user_id: userId,
      title: title,
      message: message,
    });

    return {
      success: true,
      message: "Notification added successfully!",
    };

  } catch (error) {
    console.error("Something went wrong:", error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};

module.exports = { addNotification };