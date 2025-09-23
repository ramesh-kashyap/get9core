// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const sequelize = require('./config/connectDB');
require('./cron/cronController');  // Load cron jobs
const authRoutes = require('./routes/web');

// Create Express app
const app = express();
// Middleware
app.use(helmet());
const allowlist = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (allowlist.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin} not in allowlist: ${allowlist.join(",")}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};

app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health Check
app.get('/', (req, res) => res.send({ status: 'API is Running 🚀' }));

// Database Connection and Server Start
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log("✅ Database Connected Successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database Connection Error:", err);
    process.exit(1);  // Exit if DB connection fails
  });
