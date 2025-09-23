const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const Withdraw = require('../models/Withdraw');
const Investment = require('../models/Investment');
const BuyFund = require('../models/BuyFunds');
const User = require('../models/User');
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(200).json({ success: false, message: "User not authenticated!" });
    }

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(200).json({ success: false, message: "User not found!" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const filterType = req.query.type || '';
    const filterMonth = req.query.month || ''; // e.g., "2025-06"

    const [investmentHistory, incomeHistory, buyfunds, withdrawHistory] = await Promise.all([
      Investment.findAll({ where: { user_id: userId } }),
      Income.findAll({ where: { user_id: userId } }),
      BuyFund.findAll({ where: { user_id: userId } }),
      Withdraw.findAll({ where: { user_id: userId } }),
    ]);

    let merged = [
      ...investmentHistory.map(item => ({ ...item.toJSON(), type: 'investment', remarks: 'Deposits' })),
      ...incomeHistory.map(item => ({ ...item.toJSON(), type: 'income', remarks: item.remarks})),
      ...buyfunds.map(item => ({ ...item.toJSON(), type: 'buyfund', remarks: 'Bot Activation Bonus' })),
      ...withdrawHistory.map(item => ({ ...item.toJSON(), type: 'withdraw', remarks: 'Withdrawal' })),
    ];

    // Apply filters here
    if (filterType) {
      merged = merged.filter(tx =>
        tx.remarks?.toLowerCase() === filterType.toLowerCase()
      );
    }

    if (filterMonth) {
      merged = merged.filter(tx =>
        tx.created_at?.toISOString().startsWith(filterMonth)
      );
    }

    const sorted = merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const paginated = sorted.slice(offset, offset + limit);

    res.json({
      success: true,
      transactions: paginated,
      total: sorted.length,
      page,
      totalPages: Math.ceil(sorted.length / limit),
    });
  } catch (error) {
    console.error("Error fetching histories:", error.message);
    res.status(500).json({ error: error.message });
  }
};
  

module.exports = {getUserHistory};
