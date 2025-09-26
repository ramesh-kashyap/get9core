const sequelize = require('../config/connectDB');
const bcrypt = require("bcryptjs");
require('dotenv').config();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const BuyFund = require('../models/BuyFunds');
const logger = require("../../utils/logger");
const { addNotification } = require('../helper/helper');
const {sendEmail,sendEmailRegister } = require("../services/userService");
const moment = require('moment');

const register = async (req, res) => {
    try {
        const { name, email, password, sponsor, otp } = req.body;
        
        if ( !name  || !email || !password || !otp || !sponsor) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const [otpRecord] = await sequelize.query(
          'SELECT * FROM password_resets WHERE email = ? AND token = ? ORDER BY created_at DESC LIMIT 1',
          {
            replacements: [email, otp],
            type: sequelize.QueryTypes.SELECT
          }
        );
    
        if (!otpRecord) {
          return res.status(400).json({ message: "Invalid or expired verification code!" });
        }

  
        const existingUser = await User.findOne({where: { email: email } });
        
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists!" });
        }
        
        // Check if sponsor exists
        const sponsorUser = await User.findOne({
            where: {
                username: sponsor  // Match the sponsor's username
            }
        });
        if (!sponsorUser) {
            return res.status(400).json({ error: "Sponsor does not exist!" });
        }
  
        // Generate username & transaction password
        const username = "ZY"+Math.floor(100000 + Math.random() * 900000); 
        const tpassword = Math.random().toString(36).substring(2, 8);
  
        // Hash passwords
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedTPassword = await bcrypt.hash(tpassword, 10);
  
        // Get parent ID
        const lastUser = await User.findOne({
            order: [['id', 'DESC']]
        });
        const parentId = lastUser ? lastUser.id : null;
        // Provide a default for sponsor level if it's undefined or null
        const sponsorLevel = (sponsorUser.level !== undefined && sponsorUser.level !== null)
            ? sponsorUser.level
            : 0;
  
        // Construct new user object
        const newUser = {
            name,
            email,
            username,
            password: hashedPassword,
            tpassword: hashedTPassword,
            PSR: password,
            TPSR: tpassword,
            sponsor: sponsorUser.id,
            level: sponsorLevel + 1,  // Default to 0 if sponsor level is not defined, then add 1
            ParentId: parentId,
            jdate: new Date().toISOString().split('T')[0],
            // dialCode: countryCode,
        };
  
        // Insert new user into the database
        const createdUser = await User.create(newUser);

// Call bonus logic correctly
await registerbonus(createdUser);

 const emailSent =  await sendEmailRegister(email, "Welcome to ZyloAi - Your Login Details", {
            name: name || "User",
            password: password       
           });
           
           
      await addNotification(createdUser.id, 'Welcome to Zylo AI', 'Welcome aboard! Begin your journey with Zylo AI, unlock exciting rewards, and connect with our vibrant community. Our support team is always here to help. We are thrilled to have you with us and cannot wait to see your success!');
           
return res.status(201).json({ message: "User registered successfully!", username });

  
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};


  const registerbonus = async (createdUser) => {
    console.log(createdUser);
  try {
    const bonusAmount = 3;
    const invoice = Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000;
    const txnId = 'BONUS-' + Date.now();
    const now = new Date();

    await BuyFund.create({
      orderId: invoice,
      txn_no: txnId,
      user_id: createdUser.id,
      user_id_fk: createdUser.username,
      remarks:"registration_bonus",
      amount: bonusAmount,
      type: 'registration_bonus',
      status: 'Approved',
      bdate: now,
    });
    return res.status(200).json({ success: false,message:"Welcome Bonus Added successfully"});
  } catch (bonusErr) {
    console.error("Failed to credit registration bonus:", bonusErr.message);
  }
};



const login = async (req, res) => {

    try {
          console.log("email");

      // Destructure username and password from the request body.
      const { email, password } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
          return res.status(400).json({ error: "Invalid email address" });
      }
      if (!email || !password) {
        return res.status(400).json({ error: "Username and Password are required!" });
      }
         
      // Find the user using Sequelize
      const user = await User.findOne({ where: { email } });
       
      if (!user) {
        return res.status(400).json({ error: "User not found!" });

      }
      // Compare the provided password with the stored hashed password.
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials!" });
      }
  
      // Generate a JWT token.
      
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,  
       
      );
  
      return res.status(200).json({
        status:true,
        message: "Login successful!",
        username: user.username,
        token,
      });
    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ status:false , error: "Server error", details: error.message });
    }
  };




  const forgotPassword = async (req, res) => {
    try {
      const { email, password, password_confirmation, verification_code } = req.body;
  
      if (!email || !password || !password_confirmation || !verification_code) {
        return res.status(400).json({ message: "All fields are required!" });
      }
  
      if (password !== password_confirmation) {
        return res.status(400).json({ message: "Passwords do not match!" });
      }
  
      const [otpRecord] = await sequelize.query(
        'SELECT * FROM password_resets WHERE email = ? AND token = ? ORDER BY created_at DESC LIMIT 1',
        {
          replacements: [email, verification_code],
          type: sequelize.QueryTypes.SELECT
        }
      );
  
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired verification code!" });
      }
  
      const user = await User.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({ message: "User not found!" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.PSR = password;
      await user.save();
  
     
      // await password_resets.destroy({ where: { email, token: verification_code } });
  
      return res.status(200).json({
        success: true,
        message: "Password reset successfully!"
      });
  
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  


const sendForgotOtp = async (req, res) => {
    console.log("📧 Attempting to send email...");
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email not registered!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const created_at = new Date();

    // Remove existing OTPs
    await sequelize.query(
      'DELETE FROM password_resets WHERE email = ?',
      {
        replacements: [email],
        type: sequelize.QueryTypes.DELETE,
      }
    );

    // Save new OTP
    await sequelize.query(
      'INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, ?)',
      {
        replacements: [email, otp, created_at],
        type: sequelize.QueryTypes.INSERT,
      }
    );
     const message = `
            <h2>OTP Verification</h2>
            <p>Hello ${user.name || "User"},</p>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 5 minutes.</p>
            <p>Thank you for using our service.</p>
        `;
        
         const emailSent =  await sendEmail(email, "Your One-Time Password", {
            name: user.name || "User",
            code: otp       
           });

    
        // if (!emailSent) {
        //     return res.status(500).json({ success: false, message: "Failed to send OTP email" });
        // }
    // Send OTP via email (configure in prod)
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: 'your@email.com',
    //     pass: 'your-app-password'
    //   }
    // });

    // await transporter.sendMail({
    //   from: '"Support" <your@email.com>',
    //   to: email,
    //   subject: 'Your OTP for Password Reset',
    //   text: `Your verification code is: ${otp}`
    // });

    return res.status(200).json({ success: true, message: "OTP sent to your email!" });

  } catch (error) {
    console.error("Forgot OTP send error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};





const sendRegisterOtp = async (req, res) => {
  console.log("📧 Attempting to send email...");
  console.log(req.body);
try {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required!" });
  }


  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const created_at = new Date();

  // Remove existing OTPs
  await sequelize.query(
    'DELETE FROM password_resets WHERE email = ?',
    {
      replacements: [email],
      type: sequelize.QueryTypes.DELETE,
    }
  );

  // Save new OTP
  await sequelize.query(
    'INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, ?)',
    {
      replacements: [email, otp, created_at],
      type: sequelize.QueryTypes.INSERT,
    }
  );
      
       const emailSent = await sendEmail(email, "Your One-Time Password", {
            name:"User",
            code: otp       
           });



  return res.status(200).json({ success: true, message: "OTP sent to your email!" });

} catch (error) {
  console.error("Forgot OTP send error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
}
};



function getNewDetailChangedDate(detailChangedDate,hours) {
   const now = moment();
  const isValidDate = moment(detailChangedDate, 'YYYY-MM-DD HH:mm:ss', true).isValid();
  let baseDate = (isValidDate && moment(detailChangedDate).isAfter(now))
    ? moment(detailChangedDate)
    : now;
  return baseDate.add(hours, 'hours').format('YYYY-MM-DD HH:mm:ss');
}

const changeMail = async (req, res) => { 
  try {
     console.log(req.body);
    const { changeEmail, verification_code1, newmail, verification_code } = req.body;

    // 1. Get OTP for old (current) email
    const [oldOtp] = await sequelize.query(
  'SELECT * FROM password_resets WHERE token = ? AND email = ? ORDER BY created_at DESC LIMIT 1',
  {
    replacements: [verification_code1, changeEmail],
    type: sequelize.QueryTypes.SELECT
  }
);


    if (!oldOtp) {
      return res.status(404).json({ message: "Invalid or expired verification code for current email!" });
    }

    // 2. Get OTP for new email
    const [newOtp] = await sequelize.query(
  'SELECT * FROM password_resets WHERE token = ? AND email = ? ORDER BY created_at DESC LIMIT 1',
  {
    replacements: [verification_code, newmail],
    type: sequelize.QueryTypes.SELECT
  }
);


    if (!newOtp) {
      return res.status(404).json({ message: "Invalid or expired verification code for new email!" });
    }

    // 3. Validate new email is not already used
    const emailExists = await User.findOne({ where: { email: newmail } });
    if (emailExists) {
      return res.status(400).json({ message: "New email is already in use!" });
    }

    // 4. Get the current user from old email (verified by OTP)
    const user = await User.findOne({ where: { email: oldOtp.email } });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    
     const detailChangedDate = getNewDetailChangedDate(user.detail_changed_date,48);

    // 5. Update user's email to new email
    user.email = newmail;
     user.detail_changed_date = detailChangedDate;
    await user.save();

    // 6. Delete both OTP records
    await sequelize.query('DELETE FROM password_resets WHERE token IN (?, ?)', {
      replacements: [verification_code1, verification_code],
      type: sequelize.QueryTypes.DELETE
    });

    return res.status(200).json({
      success: true,
      message: "Email changed successfully!"
    });

  } catch (error) {
    console.error("Change email error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




 
  
module.exports = { register ,login,forgotPassword,sendForgotOtp,sendRegisterOtp,changeMail };
