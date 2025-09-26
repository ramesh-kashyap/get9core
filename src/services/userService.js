const { User, Investment,Income,Withdraw,Machine} = require("../models"); // Adjust path as needed
const { Op } = require("sequelize"); // ✅ Import Sequelize Operators
const nodemailer = require("nodemailer");
const BuyFund = require("../models/BuyFunds");
const sequelize = require('../config/connectDB');
// Get user's VIP level

async function getVip1(userId) {
    try {
        const user = await User.findByPk(userId);
        if (!user) return 0;

        const levelTeam = await myLevelTeamCount(user.id);
        const genTeam = {
            1: levelTeam[1] || [],
            2: levelTeam[2] || [],
            3: levelTeam[3] || []
        };

        // Count active users in gen1 and gen2+gen3 (no package amount check)
        const gen1Count = await User.count({
            where: {
                id: genTeam[1],
                active_status: "Active"
            }
        });

        const gen2_3Count = await User.count({
            where: {
                id: [...genTeam[2], ...genTeam[3]],
                active_status: "Active"
            }
        });

        const userBalance = await getBalance(userId);
        let vipLevel = 0;

        if (userBalance >= 50) {
            vipLevel = 1;
        }
        if (userBalance >= 501 && gen1Count >= 5 && gen2_3Count >= 10) {
            vipLevel = 2;
        }
        if (userBalance >= 2501 && gen1Count >= 7 && gen2_3Count >= 23) {
            vipLevel = 3;
        }
        if (userBalance >= 7501 && gen1Count >= 20 && gen2_3Count >= 40) {
            vipLevel = 4;
        }
         if (userBalance >= 30001 && gen1Count >= 30 && gen2_3Count >= 90) {
            vipLevel = 5;
        }
          if (userBalance >= 60001 && gen1Count >= 50 && gen2_3Count >= 250) {
            vipLevel = 6;
        }
        return vipLevel;

    } catch (error) {
        console.error("Error in getVip:", error);
        return 0;
    }
}

const getTeamCounts = async (userId, level = 3) => {
  let arrin = [userId];
  let ret = {};
  let i = 1;

  while (arrin.length > 0 && i <= level) {
    const allDown = await User.findAll({
      attributes: ["id", "active_status"],
      where: { sponsor: { [Op.in]: arrin } },
    });

    if (allDown.length === 0) break;
    arrin = allDown.map((user) => user.id);
    ret[i] = allDown;
    i++;
  }

  const teamA = (ret[1] || []).filter((u) => u.active_status === "Active");
  const teamB = (ret[2] || []).filter((u) => u.active_status === "Active");
  const teamC = (ret[3] || []).filter((u) => u.active_status === "Active");

  return {
    teamA: teamA.length,
    teamB: teamB.length,
    teamC: teamC.length,
  };
};

const getTeamPerformance = async (userId, level = 3, startDate, endDate) => {
  let arrin = [userId];
  let totalInvestment = 0;
  let i = 1;

  while (arrin.length > 0 && i <= level) {
    const allDown = await User.findAll({
      attributes: ["id"],
      where: { sponsor: { [Op.in]: arrin } },
    });
    if (allDown.length === 0) break;
    arrin = allDown.map((user) => user.id);

    const investments = await Investment.findAll({
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
      where: {
        user_id: { [Op.in]: arrin },
        created_at: { [Op.between]: [startDate, endDate] },
      },
      raw: true,
    });

    totalInvestment += parseFloat(investments[0].total || 0);
    console.log("totalInvestment",totalInvestment);
    i++;
  }

  return totalInvestment;
};

const getVip = async (userId) => {
  const firstInvestment = await Investment.findOne({
    where: { user_id: userId },
    order: [["created_at", "ASC"]],
  });

  if (!firstInvestment) return null;

  const startDate = new Date(firstInvestment.created_at);
  const now = new Date();

  // Total user investment
  const totalUserInvestment =
    (await Investment.sum("amount", {
      where: {
        user_id: userId,
        created_at: { [Op.between]: [startDate, now] },
      },
    })) || 0;

  // Team counts
  const team = await getTeamCounts(userId, 3);

  // Team performance
  const teamPerformance = await getTeamPerformance(userId, 3, startDate, now);

  // VIP levels config
  const vipLevels = [
    { name: "VIP 1", investMin: 50, investMax: 500, teamA: 0, teamB: 0, teamC: 0, perfMin: 0, days: 30 },
    { name: "VIP 2", investMin: 300, investMax: 1500, teamA: 2, teamB: 1, teamC: 0, perfMin: 1000, days: 45 },
    { name: "VIP 3", investMin: 800, investMax: 3000, teamA: 5, teamB: 3, teamC: 1, perfMin: 5000, days: 60 },
    { name: "VIP 4", investMin: 1500, investMax: 5000, teamA: 10, teamB: 6, teamC: 3, perfMin: 15000, days: 75 },
    { name: "VIP 5", investMin: 3000, investMax: 10000, teamA: 20, teamB: 12, teamC: 6, perfMin: 50000, days: 90 },
    { name: "VIP 6", investMin: 5000, investMax: 20000, teamA: 30, teamB: 18, teamC: 8, perfMin: 100000, days: 120 },
    { name: "VIP 7", investMin: 10000, investMax: 50000, teamA: 50, teamB: 30, teamC: 15, perfMin: 200000, days: 180 },
  ];

  let latestVip = null;

  for (const vip of vipLevels) {
    // Check investment condition
    const investOk =
      totalUserInvestment >= vip.investMin &&
      totalUserInvestment <= vip.investMax;

    // Check team condition
    const teamOk =
      team.teamA >= vip.teamA &&
      team.teamB >= vip.teamB &&
      team.teamC >= vip.teamC;

    // Check performance condition
    const perfOk = teamPerformance >= vip.perfMin;

    // Check days condition
    const daysUsed = (now - startDate) / (1000 * 60 * 60 * 24);
    const daysOk = daysUsed <= vip.days;

    if (investOk && teamOk && perfOk && daysOk) {
      latestVip = vip.name; // overwrite with higher VIP if matched
    }
  }

  return latestVip;
};

// Get user's level team count (downline up to 'level' generations)
async function myLevelTeamCount(userId, level = 3) {
    try {
        let currentLevelUsers = [userId];
        let team = {};
        for (let i = 1; i <= level; i++) {
            const downline = await User.findAll({
                attributes: ["id"],
                where: { sponsor: currentLevelUsers }
            });

            if (downline.length === 0) break;
            currentLevelUsers = downline.map(user => user.id);
            team[i] = currentLevelUsers;
        }

        return team;
    } catch (error) {
        console.error("Error in myLevelTeamCount:", error);
        return {};
    }
}

// Get user's balance (active investments)

async function getBalance(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) return 0;

    // 1) grab the raw sums (could be null)
    const [ totalCommissionRaw, investmentRaw, RegisterBonus, totalWithdrawRaw ] = 
      await Promise.all([
        Income.sum('comm', {
          where: { user_id: userId }
        }),
        Investment.sum('amount', {
          where: { user_id: userId, status: 'Active' }
        }),
         BuyFund.sum('amount', {
          where: { user_id: userId, status: 'Approved' }
        }),
        Withdraw.sum('amount', {
          where: {
            user_id: userId,
            status:   { [Op.ne]: 'Failed' }
          }
        })
      ]);

    // 2) coerce to Number, defaulting null/undefined → 0
    const totalCommission = Number(totalCommissionRaw  ?? 0);
    const investment     = Number(investmentRaw      ?? 0);
    const RegisterBnus     = Number(RegisterBonus      ?? 0);
    const totalWithdraw  = Number(totalWithdrawRaw  ?? 0);

    // 3) Now the math will never be NaN
    const totalBalance = (totalCommission + investment +RegisterBnus) - totalWithdraw;

    // console.log("Balance:", totalBalance);
    return totalBalance.toFixed(3);
  }
  catch (error) {
    console.error("Error in getBalance:", error);
    return 0;
  }
}

async function getPercentage(vipLevel) {
    try {
        let idx = (vipLevel==0)?1:vipLevel;
        const user = await Machine.findOne({where: {m_id: idx }});
        return user.m_return || 0;
    } catch (error) {
        console.error("Error in getBalance:", error);
        return 0;
    }
}


async function getQuantifition(vipLevel) {
    try {
        const user = await Machine.findOne({ where: { m_id: vipLevel } });
        return user.trade || 0;
    } catch (error) {
        // console.error("Error fetching quantification:", error);
        return 0;
    }
}


async function sendEmail(email, subject, data) {
    try {
        // ✅ Create a transporter using cPanel SMTP
        const transporter = nodemailer.createTransport({
            host: "mail.zyloq.app", // Replace with your cPanel SMTP host
            port: 465, // Use 465 for SSL, 587 for TLS
            secure: true, // true for 465, false for 587
            auth: {
                user: "info@zyloq.app", // Your email
                pass: "]oKr7fXdaR4ERGa&", // Your email password
            },
        });
        const mailOptions = {
            from: '"Zylo Ai" <info@zyloq.app>', // Replace with your email
            to: email,
            subject: subject,
            html: `<p>Hi ${data.name},</p>
                   <p>We’re inform you that a One-Time Password (OTP) has been generated for your account authentication. Please use the OTP below to continue with your verification process.</p>
                   <p>OTP: ${data.code}</p>`,
        };
        // ✅ Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
async function sendEmailRegister(email, subject, data) {
    try {
        // ✅ Create a transporter using cPanel SMTP
        const transporter = nodemailer.createTransport({
            host: "mail.zyloq.app", // Replace with your cPanel SMTP host
            port: 465, // Use 465 for SSL, 587 for TLS
            secure: true, // true for 465, false for 587
            auth: {
                user: "info@zyloq.app", // Your email
                pass: "]oKr7fXdaR4ERGa&", // Your email password
            },
        });
        const mailOptions = {
            from: '"Zylo Ai" <info@zyloq.app>', // Replace with your email
            to: email,
            subject: subject,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #ddd; border-radius: 10px;">
                  <h2 style="color: #333; text-align: center;">Welcome to ZyloAi!</h2>
                
                  <p>Hi <strong>${data.name}</strong>,</p>
                
                  <p>Your registration is successful. Below are your login credentials:</p>
                
                  <div style="background-color: #f8f8f8; padding: 15px 20px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Password:</strong> ${data.password}</p>
                  </div>
                
                  <p style="margin-top: 20px;">You can now log in and start using your account.</p>
                
                  <p style="margin-top: 30px;">Best regards,<br><strong>ZyloAi Team</strong></p>
                
                  <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;" />
                  <p style="font-size: 12px; color: #888888;">If you did not request this registration, please contact us immediately.</p>
                </div>`,
        };
        // ✅ Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

async function addLevelIncome(userId, amount) {
    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) return false;

        let userMid = user.id;
        let sponsorId;
        let cnt = 1;
        let baseAmount = amount / 100;
        const rname = user.username;
        const fullname = user.name;

        while (userMid && userMid !== 1) {
            const currentUser = await User.findOne({ where: { id: userMid } });
            sponsorId = currentUser.sponsor;
            const sponsorDetails = await User.findOne({ where: { id: sponsorId } });
             if (!sponsorDetails) break;
            let sponsorStatus = "Pending";
            let vipLevel = 0;

            if (sponsorDetails) {
                sponsorStatus = sponsorDetails.active_status;
                vipLevel = await getVip(sponsorDetails.id);
            }

            // Define multipliers for different VIP levels
            const multipliers = {
                1: [0, 0, 0],
                2: [12, 5, 3],
                3: [14, 7, 4 ],
                4: [17, 8, 5],
                5: [18, 9, 6],
                6: [20, 10, 8],
            };
            const currentMultipliers = multipliers[vipLevel] || [0, 0, 0]; // Default to VIP 1 multipliers

            let commission = 0;
            if (sponsorStatus === "Active" && vipLevel >= 2) {
                if (cnt === 1) commission = baseAmount * currentMultipliers[0];
                if (cnt === 2) commission = baseAmount * currentMultipliers[1];
                if (cnt === 3) commission = baseAmount * currentMultipliers[2];
              
            }
            if (sponsorId && cnt <= 3 && commission > 0) {
                // Insert income record
                await Income.create({
                    user_id: sponsorDetails.id,
                    user_id_fk: sponsorDetails.username,
                    amt: amount,
                    comm: commission,
                    remarks: "Team Commission",
                    level: cnt,
                    rname,
                    fullname,
                    ttime: new Date(),
                });

                // Update user balance
                await User.update(
                    { userbalance: sponsorDetails.userbalance + commission },
                    { where: { id: sponsorDetails.id } }
                );
            }

            userMid = sponsorDetails.id;
            cnt++;
        }

        return true;
    } catch (error) {
        console.error("Error in addLevelIncome:", error);
        return false;
    }
}


module.exports = { getVip, myLevelTeamCount, getBalance,getPercentage,addLevelIncome,sendEmail ,getQuantifition,sendEmailRegister};