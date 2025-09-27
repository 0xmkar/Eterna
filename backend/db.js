const pool = require('./config/database.js');
const dotenv = require("dotenv");
dotenv.config();
const getExponentialBackOffTime = require("./utilityFunctions.js");

// Following function inserts perp price update in the database
// all the parameters must be BigInt
// on successful inserting this function returns 1. On failure, it sends mail to developer and returns -1
async function storePerpData(perpPrice, timestamp, blockNumber) {
  let attemptNumber = 1;
  let baseWaitPeriod = 1000; //1 second
  let maxWaitPeriod = 15000; //15 seconds

  while (attemptNumber <= 6) {
    if (attemptNumber > 5) {
      console.error("Error encountered multiple times while trying to insert perp price update in the database. Please check.");
      return -1;
    } else {
      try {
        // Convert BigInt values to strings for database storage
        const data = {
          perp_price: perpPrice.toString(),
          timestamp: timestamp.toString(),
          block_number: blockNumber.toString(),
        };

        // Insert data into the perp_prices table using PostgreSQL
        const result = await pool.query(
          'INSERT INTO perp_prices (perp_price, timestamp, block_number) VALUES ($1, $2, $3) RETURNING *',
          [data.perp_price, data.timestamp, data.block_number]
        );

        return 1;
      } catch (error) {
        console.error(`Attempt ${attemptNumber} failed:`, error);
        attemptNumber++;
        if (attemptNumber <= 6) {
          const waitTime = getExponentialBackOffTime(
            attemptNumber,
            baseWaitPeriod,
            maxWaitPeriod
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }
}

// Following function fetches the latest block number from the database
// on successful fetching this function returns the latest block number. On failure, it sends mail to developer and returns null
async function getLatestBlockNumber() {
  let attemptNumber = 1;
  let baseWaitPeriod = 1000; //1 second
  let maxWaitPeriod = 15000; //15 seconds

  while (attemptNumber <= 6) {
    if (attemptNumber > 5) {
      console.error("Error encountered multiple times while trying to fetch latest block number from the database. Please check.");
      return null;
    } else {
      try {
        // Fetch the latest block number from PostgreSQL
        const result = await pool.query(
          'SELECT block_number FROM perp_prices ORDER BY block_number DESC LIMIT 1'
        );

        if (result.rows.length > 0) {
          return BigInt(result.rows[0].block_number);
        } else {
          return null; // No data found
        }
      } catch (error) {
        console.error(`Attempt ${attemptNumber} failed:`, error);
        attemptNumber++;
        if (attemptNumber <= 6) {
          const waitTime = getExponentialBackOffTime(
            attemptNumber,
            baseWaitPeriod,
            maxWaitPeriod
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }
}

// Following function fetches specific range of data from the database
// on successful fetching this function returns the data. On failure, it sends mail to developer and returns empty array
async function getSpecificDataRange(x, y) {
  let attemptNumber = 1;
  let baseWaitPeriod = 1000; //1 second
  let maxWaitPeriod = 15000; //15 seconds

  while (attemptNumber <= 6) {
    if (attemptNumber > 5) {
      console.error("Error encountered multiple times while trying to fetch specific data range from the database. Please check.");
      return [];
    } else {
      try {
        // Fetch specific range from PostgreSQL
        const result = await pool.query(
          'SELECT * FROM perp_prices ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
          [y - x + 1, x - 1]
        );

        return result.rows.map(row => ({
          perp_price: row.perp_price,
          timestamp: row.timestamp,
          block_number: row.block_number
        }));
      } catch (error) {
        console.error(`Attempt ${attemptNumber} failed:`, error);
        attemptNumber++;
        if (attemptNumber <= 6) {
          const waitTime = getExponentialBackOffTime(
            attemptNumber,
            baseWaitPeriod,
            maxWaitPeriod
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }
}

module.exports = { 
  storePerpData, 
  getLatestBlockNumber, 
  getSpecificDataRange 
}; 