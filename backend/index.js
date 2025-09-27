const dotenv = require("dotenv");
dotenv.config();
const { getSpecificDataRange } = require("./db.js");
const start = require("./handleExecuteFundingRateMechanismFunction.js");
const listenAndRespondToPerpPriceUpdatedEvent = require("./handlePerpPriceUpdatedEvent.js");
const cors = require("cors");

// Import routes
const userRoutes = require("./routes/users.js");
const orderRoutes = require("./routes/orders.js");

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
});
startFundingRateAndPerpPriceUpdateHandling(); 