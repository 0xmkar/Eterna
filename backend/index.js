const dotenv = require("dotenv");
dotenv.config();
const { getSpecificDataRange } = require("./db.js");
const start = require("./handleExecuteFundingRateMechanismFunction.js");
const listenAndRespondToPerpPriceUpdatedEvent = require("./handlePerpPriceUpdatedEvent.js");
const cors = require("cors");

// Import routes
const userRoutes = require("./routes/users.js");
const orderRoutes = require("./routes/orders.js");
const cronRoutes = require("./routes/cronRoutes.js");

// Import cron job service
const cronJobService = require("./services/cronJobService.js");

// express app
const express = require("express");
const app = express();
const port = process.env.PORT || 3001; // Default to 3001 as per memory
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Use routes
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/cron", cronRoutes);

async function startFundingRateAndPerpPriceUpdateHandling() {
  await start();
  await listenAndRespondToPerpPriceUpdatedEvent();
}

app.get("/getPerpPriceData", async (req, res) => {
  const { x, y } = req.query;

  if (!x || !y || isNaN(x) || isNaN(y)) {
    return res.status(400).json({ error: "Invalid x or y value" });
  }

  try {
    const dataPoints = await getSpecificDataRange(parseInt(x), parseInt(y));
    res.json({ dataPoints }); // Send the fetched data points to the frontend
  } catch (err) {
    // console.log("error is :", err);
    res.status(500).json({ error: "Error fetching data points." });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
  
  // Start cron job service after server starts
  setTimeout(() => {
    console.log("Starting order matching and execution service...");
    cronJobService.start();
  }, 2000); // Wait 2 seconds for server to fully initialize
});

// Start funding rate and perp price update handling
startFundingRateAndPerpPriceUpdateHandling();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  cronJobService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  cronJobService.stop();
  process.exit(0);
}); 