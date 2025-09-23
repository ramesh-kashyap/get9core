const Deposit = require('../models/BuyFunds');
const Withdrawal = require('../models/Withdraw');
const Investment = require('../models/Investment');
const Income = require('../models/Income');

const fetchDeposits = async (userId) => {
  const deposits = await Deposit.findAll({
    where: { user_id: userId },
    raw: true
  });
  return deposits.map(row => ({ type: 'deposits', ...row }));

};

const fetchWithdrawals = async (userId) => {
  const withdrawals = await Withdrawal.findAll({
    where: { user_id: userId },
    raw: true
  });
  return withdrawals.map(row => ({ type: 'withdrawals', ...row }));

};

const fetchInvestments = async (userId) => {
  const investments = await Investment.findAll({
    where: { user_id: userId },
    raw: true
  });
  return investments.map(row => ({ type: 'investments', ...row }));

};

const fetchIncome = async (userId) => {
  const incomes = await Income.findAll({
    where: { user_id: userId },
    raw: true
  });
  return incomes.map(row => ({ type: 'Income', ...row }));
};

module.exports = {
  fetchDeposits,
  fetchWithdrawals,
  fetchInvestments,
  fetchIncome
};
