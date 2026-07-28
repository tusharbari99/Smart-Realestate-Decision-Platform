const path = require("path");
const express = require('express');
const helmet = require('helmet');

const {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  adminActionLimiter,
} = require('./middleware/securityMiddleware');

const cors = require('cors');
require('dotenv').config();

const {
  validateEnvironment,
} = require('./config/validateEnv');


const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const profileRoutes = require('./routes/profileRoutes');
const personalizationRoutes = require('./routes/personalizationRoutes');
const { startNotificationScheduler } = require("./services/notificationScheduler");
const phoneValidationMiddleware = require("./middleware/phoneValidationMiddleware");

const propertyEditRequestRoutes = require('./routes/propertyEditRequestRoutes');

const propertyMediaRoutes = require("./routes/propertyMediaRoutes");

validateEnvironment();

const app = express();

app.disable('x-powered-by');
app.use(helmetMiddleware);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use('/api/auth', authLimiter);

app.use(
  '/api/personalization/admin',
  adminActionLimiter,
);

app.use('/api', apiLimiter);

const allowedOrigins = [
  ...String(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(
  (origin, index, origins) =>
    origins.indexOf(origin) === index
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(phoneValidationMiddleware);

app.get('/', (req, res) => {
  res.send('Server is running and connected to Smart Real Estate backend');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartEstate API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api', interactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/personalization', personalizationRoutes);

const PORT = process.env.PORT || 5001;

app.use('/api/property-edit-requests', propertyEditRequestRoutes);


app.use("/api/property-media", propertyMediaRoutes);
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request data is too large.",
    });
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      message: "Invalid JSON data.",
    });
  }

  res.status(error.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong on the server."
        : error.message || "Something went wrong on the server.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

startNotificationScheduler();
});
