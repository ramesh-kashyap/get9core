const axios     = require('axios');
const moment    = require('moment-timezone');
const NodeCache = require('node-cache');
const coinCache = new NodeCache({ stdTTL: 60 }); // cache for 60s
const {
  User,
  Contract,
  Variable,
  Machine,
  Income,
  sequelize,      // if you need transactions
} = require('../models');

const { Op } = require('sequelize');
const { getVip,getBalance,addLevelIncome,getQuantifition} = require("../services/userService");



const get_vip = async (req, res) => { 
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(200).json({success: false, message: "User not authenticated!" });
      }  
      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(200).json({success: false, message: "User not found!" });
      } 
      const vip = await getVip(userId);
    
      return res.status(200).json({success: true, vip: vip});
    } catch (error) {
      console.error("Something went wrong:", error);
      return res.status(200).json({success: false, message: "Internal Server Error" });
    }
  };



  


async function coinrates() {
  const cached = coinCache.get('coin_rates');
  if (cached) return cached;

  try {
    const resp = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin,ethereum,tether,binancecoin,cardano,solana,dogecoin,xrp,tron',
          vs_currencies: 'usd'
        },
        timeout: 10_000
      }
    );

    const data = resp.data;
    const prices = {
      eth:  data.ethereum?.usd  || 0,
      btc:  data.bitcoin?.usd   || 0,
      bnb:  data.binancecoin?.usd|| 0,
      usdt: data.tether?.usd    || 0,
      trx:  data.tron?.usd      || 0,
      doge: data.dogecoin?.usd  || 0,
      sol:  data.solana?.usd    || 0,
      xrp:  data.xrp?.usd       || 0,
      car:  data.cardano?.usd   || 0
    };

    coinCache.set('coin_rates', prices);
    return prices;
  } catch (err) {
    console.error('Coin API error:', err);
    return { error: 'Coin API request failed' };
  }
}


const myLevelTeamCount = async (userId, level = 3) => {
    let arrin = [userId];
    let ret = {};
    let i = 1;
    
    while (arrin.length > 0) {
        const allDown = await User.findAll({
            attributes: ['id'],
            where: { sponsor: { [Op.in]: arrin } }
        });

        if (allDown.length > 0) {
            arrin = allDown.map(user => user.id);
            ret[i] = arrin;
            i++;
            if (i > level) break;
        } else {
            arrin = [];
        }
    }
    return ret;
};


const stopTrade = async (req, res) => {
  try {
    const user = req.user; // assuming you're using middleware to authenticate and attach user to req

    if (!user) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const contract = await Contract.findOne({
      where: {
        user_id: user.id,
        c_status: 1
      }
    });

    if (!contract) {
      return res.status(404).json({ status: false, message: "Active contract not found" });
    }

    // Update contract status
    contract.c_status = -1;
    await contract.save();
    const nowTS = moment().format('YYYY-MM-DD HH:mm:ss');
    // Record income
    const incomeData = {
      remarks: 'Order Revenue',
      comm: contract.profit,
      amt: contract.c_ref,
      invest_id: contract.id,
      level: 0,
      ttime: moment().format('YYYY-MM-DD'),
      user_id_fk: user.username,
      user_id: user.id,
      created_at:nowTS
    };

    await Income.create(incomeData);

    // Add Team Commission
    await addLevelIncome(user.id, contract.profit);

    // Return success response
    return res.json({
      status: true,
      profit: contract.profit
    });

  } catch (error) {
    console.error("stopTrade error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};


// controllers/tradeController.js

const tradeOnJson = async (req, res) => {
  try {
    const user = req.user;
    // moment.tz.setDefault('Asia/Kolkata');
   
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();


    // 1️⃣ Prevent double‐trading
    const pending = await Contract.findOne({
      where: { user_id: user.id, c_status: 1 }
    });
    if (pending) {
         return res.json({
      success: true,
      code: 'TRADE_PLACED',
      data: {
        contractId: pending.id,
        trade:      pending.trade,
        bot:        pending.c_bot,
        qty :pending.qty,
        profit :pending.profit,
        c_name: pending.c_name,
      }
    });
    
    //   return res.json({
    //     success: false,
    //     code: 'PENDING_TRADE',
    //     message: 'You already have a pending trade.'
    //   });
    }

  
  
    const balance   = await getBalance(user.id);
    // console.log('balance'+balance);

    if (balance < 30) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds to start a trade.'
      });
    }

      // 8️⃣ Choose machine tier
    let uStr = balance;
    
    let idx =await getVip(user.id);
    
    // 4️⃣ Determine allowed trades today
     const quantifiable = await getQuantifition(idx);
    

   const todayCount = await Contract.count({
        where: {
            user_id: user.id,
            ttime: {
            [Op.between]: [startOfDay, endOfDay]
            }
        }
        });

    
    if (todayCount >= quantifiable) {
      return res.json({
        success: false,
        code: 'NO_TRADES_LEFT',
        message: 'You have used up your trades for today.'
      });
    }

    // 5️⃣ Update front-end remaining‐trade amount
    const todaySum    = await Contract.sum('profit', {
      where: { user_id: user.id, ttime: {
            [Op.between]: [startOfDay, endOfDay]
            }}
    }) || 0;


    
    const remaining   = balance - todaySum;
    const perTrade    = remaining / quantifiable;
    const tradesLeft  = quantifiable - (todayCount + 1);
    const updateAmt   = perTrade * tradesLeft;
       await User.update(
        { tradeAmt: updateAmt },
        { where: { id: user.id } }
      );

    // 6️⃣ Fetch & bump factor index
    let vars     = await Variable.findOne({ where: { v_id: 11 } });
    let tIndex   = vars.trade_index;
    if (tIndex < 0) throw new Error('Invalid trade_index');
    if (tIndex === 15) tIndex = 0;

    const factorArr = [435,193,146,193,435,146,193,146,435,435,146,193,193,146,435];
    const factor    = factorArr[tIndex];
    await vars.update({ trade_index: tIndex + 1 });

    // 7️⃣ Get coin rates
    const prices = await coinrates();
    if (prices.error) throw new Error(prices.error);

  
    // 9️⃣ Decide Buy vs Sell
    const zeroArr = ["eth","doge","btc","btc","bnb","btc","eth","eth","btc","btc","bnb","btc","eth","btc","eth","car"];
    const vIndex  = vars.v_index;
    const trade   = (vIndex % 2 === 0) ? 'Sell' : 'Buy';
    const newV    = (vIndex === 15) ? 0 : vIndex + 1;
    await vars.update({ v_index: newV });

    const sym = zeroArr[vIndex];
    const bot = await Machine.findOne({ where: { m_id: idx } });
    if (!bot) {
      return res.json({
        success: false,
        code: 'NO_BOT_FOUND',
        message: 'No trading bot available for your tier.'
      });
    }

    //  🔟 Compute prices & profit
    const pct     = parseFloat((bot.m_return / factor).toFixed(5));
    const usdPool = uStr * 0.7;
    const base    = parseFloat(prices[sym]);

    const buyBtc  = parseFloat((base - (base * pct/100)).toFixed(5));
    const sellBtc = parseFloat((base + (base * pct/100)).toFixed(5));
    const qty     = usdPool / (trade==='Buy' ? buyBtc : sellBtc);
    let   profit  = usdPool * pct;
    const refPool = uStr * 0.3 * pct;
    const nowTS = moment().format('YYYY-MM-DD HH:mm:ss');
    // cap final-trade ROI

 
    
    if (todayCount === quantifiable - 1) {
      const maxRoi = (balance - todaySum) * (bot.m_return/100);
      const extra  = maxRoi - (todaySum + profit);
      profit += extra;

      
      await User.update(
        { last_trade: nowTS },
        { where: { id: user.id } }
      );
    }

    // 1️⃣1️⃣ Insert the trade
    const contract = await Contract.create({
      user_id:    user.id,
      trade:      trade,
      c_bot:      bot.m_name,
      c_buy:      trade==='Buy'  ? buyBtc  : sellBtc,
      c_sell:     trade==='Buy'  ? sellBtc : buyBtc,
      qty:        qty,
      profit:     profit,
      c_name:     sym,
      c_status:   1,
      c_ref:      refPool,
      created_at: nowTS,
      ttime:      nowTS
    });

    // ✅ Success JSON
    return res.json({
      success: true,
      code: 'TRADE_PLACED',
      data: {
        contractId: contract.id,
        trade:      trade,
        bot:        bot.m_name,
        qty,
        profit,
        c_name:     sym,
        remainingTrades: quantifiable - (todayCount + 1)
      }
    });

  } catch (err) {
    console.error('tradeOnJson error:', err);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: err.message
    });
  }
};

 const fetchcontract = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(200).json({ success: false, message: "Not Authorised" });
    }
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(200).json({ success: false, message: "User Not Found" });
    }
    const fetchcontract = await Contract.findAll({
      where: { user_id: userId },
      order: [['id', 'DESC']], // or 'createdAt', if available
    });
    return res.status(200).json({ success: true, fetchcontract: fetchcontract});
 
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: err.message
    });
  }
};
const tradecount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(200).json({ success: false, message: "Not Authorised" });
    }
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(200).json({ success: false, message: "User Not Found" });
    }
     const vip = await getVip(userId);     
   const trade = await getQuantifition(vip);
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();
    const tradeCount = await Contract.count({
      where: {
        user_id: userId,
        ttime: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });
    return res.status(200).json({ success: true, count: tradeCount,trade:trade , last_trade :user.last_trade  });

  } catch (err) {
    return res.status(200).json({
      success: false,
      message: err.message
    });
  }
};



    //      const fetchcontract = async (res, req) ={
    //        try{

    //        }
    //        catch (err){
    //             return res.status(200).json({
    //   success: false,
    //   message: err.message
    // });
    //        }
    //      }
module.exports = { tradeOnJson,stopTrade, tradecount,fetchcontract,get_vip};