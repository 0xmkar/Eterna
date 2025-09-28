const dotenv = require("dotenv");
dotenv.config();
const { getSpecificDataRange } = require("./db.js");
const start = require("./handleExecuteFundingRateMechanismFunction.js");
const listenAndRespondToPerpPriceUpdatedEvent = require("./handlePerpPriceUpdatedEvent.js");
const cors = require("cors");

// Import routes
const userRoutes = require("./routes/users.js");
const orderRoutes = require("./routes/orders.js");

// Import cron jobs
const { startOrderMatchingCron, stopOrderMatchingCron, getOrderMatchingCronStatus } = require("./cronJobs/orderMatchingCron.js");

// express app
const express = require("express");
const app = express();
const port = process.env.PORT || 3001; // Default to 3001 as per memory
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Use routes
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);

async function startFundingRateAndPerpPriceUpdateHandling() {
  await start();
  await listenAndRespondToPerpPriceUpdatedEvent();
}

async function startOrderMatchingSystem() {
  // Start the order matching cron job
  startOrderMatchingCron();
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

// Order matching status endpoint
app.get("/order-matching/status", (req, res) => {
  const status = getOrderMatchingCronStatus();
  res.json({ 
    success: true, 
    data: {
      cronJobRunning: status.isRunning,
      currentlyProcessing: status.isProcessing,
      message: status.isRunning ? "Order matching is active" : "Order matching is stopped"
    }
  });
});

// Manual order matching trigger endpoint (for testing)
app.post("/order-matching/trigger", async (req, res) => {
  try {
    const { processOrderMatching } = require("./services/orderMatchingService");
    await processOrderMatching();
    res.json({ success: true, message: "Order matching process completed" });
  } catch (error) {
    console.error("Manual order matching trigger failed:", error);
    res.status(500).json({ success: false, error: "Order matching failed", details: error.message });
  }
});

// Debug endpoint to check orders and potential matches
app.get("/order-matching/debug", async (req, res) => {
  try {
    const pool = require("./config/database");
    
    // Get all open orders
    const ordersResult = await pool.query(`
      SELECT o.*, u.wallet_address 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      WHERE o.status = 'OPEN' 
        AND o.price IS NOT NULL
        AND o.quantity > 0
      ORDER BY o.side, o.price DESC
    `);
    
    const orders = ordersResult.rows;
    const buyOrders = orders.filter(o => o.side === 'BUY' || o.side === 'LONG');
    const sellOrders = orders.filter(o => o.side === 'SELL' || o.side === 'SHORT');
    
    // Check for potential matches
    const { findMatchingOrders } = require("./services/orderMatchingService");
    const matches = findMatchingOrders([...buyOrders], [...sellOrders]);
    
    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        buyOrders: buyOrders.length,
        sellOrders: sellOrders.length,
        potentialMatches: matches.length,
        orders: orders.map(o => ({
          id: o.id,
          side: o.side,
          price: parseFloat(o.price),
          quantity: parseFloat(o.quantity),
          user_id: o.user_id,
          wallet_address: o.wallet_address
        })),
        matches: matches.map(m => ({
          buyOrderId: m.buyOrderId,
          sellOrderId: m.sellOrderId,
          executionPrice: m.executionPrice,
          tradeQuantity: m.tradeQuantity
        }))
      }
    });
  } catch (error) {
    console.error("Debug endpoint failed:", error);
    res.status(500).json({ success: false, error: "Debug failed", details: error.message });
  }
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});

// Start all background processes
startFundingRateAndPerpPriceUpdateHandling();
startOrderMatchingSystem();

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  stopOrderMatchingCron();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  stopOrderMatchingCron();
  process.exit(0);
}); 