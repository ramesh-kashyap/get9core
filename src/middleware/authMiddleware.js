const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN"
        if (!token) {
            return res.status(200).json({success: false, error: "Unauthorized: Token missing" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.id);      
        

        if (!user) {
    return res.status(200).json({success: false, error: "Unauthorized: User not found" });
}
            req.user = user;
        
         // ✅ `req.user` me login user store karein
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(200).json({success: false, error: "Invalid token", details: error.message });
    }
};

module.exports = authMiddleware;
