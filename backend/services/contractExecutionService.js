const { ethers } = require('ethers');
const contractABI = require('../contractABI.js');
const pool = require('../config/database');

/**
 * Smart Contract Execution Service
 * Handles interaction with the DDexRBTC contract for trade execution
 */

class ContractExecutionService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.privateKey = process.env.PRIVATE_KEY;
    this.rpcUrl = process.env.RPC_URL || 'https://public-node.rsk.co';
    
    this.initializeContract();
  }

  /**
   * Initialize contract connection
   */
  async initializeContract() {
    try {
      // Initialize provider (Rootstock mainnet/testnet)
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Initialize wallet
      if (this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      }
      
      // Initialize contract
      if (this.contractAddress && this.wallet) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          contractABI,
          this.wallet
        );
        
        console.log(`Contract initialized at ${this.contractAddress}`);
      } else {
        console.warn('Contract address or private key not configured');
      }
      
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  }

  /**
   * Execute trades using the contract's bulkTransfer function
   */
  async executeTradesOnContract(trades) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    if (!Array.isArray(trades) || trades.length === 0) {
      throw new Error('No trades to execute');
    }

    try {
      // Prepare transaction data
      const { senders, recipients, amounts } = this.prepareTradeData(trades);
      
      // Validate trade data
      this.validateTradeData(senders, recipients, amounts);
      
      // Get current gas price and estimate gas
      const gasPrice = await this.getOptimalGasPrice();
      const gasEstimate = await this.estimateGas(senders, recipients, amounts);
      
      // Execute bulk transfer
      const tx = await this.contract.bulkTransfer(senders, recipients, amounts, {
        gasLimit: gasEstimate,
        gasPrice: gasPrice
      });
      
      console.log(`Trade execution transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`Trade execution successful. Gas used: ${receipt.gasUsed}`);
        
        // Update database with execution results
        await this.updateTradeExecutionStatus(trades, receipt);
        
        return {
          success: true,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          trades: trades.length
        };
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error) {
      console.error('Error executing trades on contract:', error);
      
      // Update database with failure status
      await this.updateTradeExecutionFailure(trades, error.message);
      
      throw error;
    }
  }

  /**
   * Prepare trade data for contract execution
   */
  prepareTradeData(trades) {
    const senders = [];
    const recipients = [];
    const amounts = [];

    for (const trade of trades) {
      // For each trade, we need to transfer from both buyer and seller
      // Buyer transfers to seller
      senders.push(trade.buyerAddress);
      recipients.push(trade.sellerAddress);
      amounts.push(ethers.parseEther(trade.buyerAmount.toString()));

      // Seller transfers to buyer (if different amounts due to fees/margins)
      if (trade.sellerAmount && trade.sellerAmount !== trade.buyerAmount) {
        senders.push(trade.sellerAddress);
        recipients.push(trade.buyerAddress);
        amounts.push(ethers.parseEther(trade.sellerAmount.toString()));
      }
    }

    return { senders, recipients, amounts };
  }

  /**
   * Validate trade data before execution
   */
  validateTradeData(senders, recipients, amounts) {
    if (senders.length !== recipients.length || senders.length !== amounts.length) {
      throw new Error('Trade data arrays length mismatch');
    }

    if (senders.length === 0) {
      throw new Error('No trade data provided');
    }

    if (senders.length > 100) {
      throw new Error('Too many trades in single batch (max 100)');
    }

    // Validate addresses
    for (let i = 0; i < senders.length; i++) {
      if (!ethers.isAddress(senders[i])) {
        throw new Error(`Invalid sender address: ${senders[i]}`);
      }
      if (!ethers.isAddress(recipients[i])) {
        throw new Error(`Invalid recipient address: ${recipients[i]}`);
      }
      if (amounts[i] <= 0) {
        throw new Error(`Invalid amount: ${amounts[i]}`);
      }
    }
  }

  /**
   * Get optimal gas price
   */
  async getOptimalGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      
      // Use a slightly higher gas price for faster execution
      const gasPrice = feeData.gasPrice * 110n / 100n; // 10% higher
      
      return gasPrice;
    } catch (error) {
      console.error('Error getting gas price:', error);
      // Fallback gas price (in wei) - 0.06 gwei for Rootstock
      return ethers.parseUnits('0.06', 'gwei');
    }
  }

  /**
   * Estimate gas for bulk transfer
   */
  async estimateGas(senders, recipients, amounts) {
    try {
      const estimate = await this.contract.bulkTransfer.estimateGas(
        senders, 
        recipients, 
        amounts
      );
      
      // Add 20% buffer
      return estimate * 120n / 100n;
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Fallback gas estimate
      const baseGas = 100000n; // Base gas
      const perTransferGas = 50000n; // Gas per transfer
      return baseGas + (BigInt(senders.length) * perTransferGas);
    }
  }

  /**
   * Check user balances before execution
   */
  async checkUserBalances(trades) {
    const balanceChecks = [];

    for (const trade of trades) {
      try {
        // Check buyer balance
        const buyerBalance = await this.contract.balanceOf(trade.buyerAddress);
        const buyerRequired = ethers.parseEther(trade.buyerAmount.toString());
        
        if (buyerBalance < buyerRequired) {
          balanceChecks.push({
            address: trade.buyerAddress,
            required: trade.buyerAmount,
            available: ethers.formatEther(buyerBalance),
            sufficient: false
          });
        }

        // Check seller balance
        const sellerBalance = await this.contract.balanceOf(trade.sellerAddress);
        const sellerRequired = ethers.parseEther(trade.sellerAmount.toString());
        
        if (sellerBalance < sellerRequired) {
          balanceChecks.push({
            address: trade.sellerAddress,
            required: trade.sellerAmount,
            available: ethers.formatEther(sellerBalance),
            sufficient: false
          });
        }

      } catch (error) {
        console.error(`Error checking balance for trade ${trade.id}:`, error);
        balanceChecks.push({
          address: 'unknown',
          error: error.message,
          sufficient: false
        });
      }
    }

    return balanceChecks;
  }

  /**
   * Update database with successful execution
   */
  async updateTradeExecutionStatus(trades, receipt) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const trade of trades) {
        await client.query(`
          UPDATE trades 
          SET 
            execution_status = 'EXECUTED',
            transaction_hash = $1,
            block_number = $2,
            gas_used = $3,
            executed_at = NOW()
          WHERE id = $4
        `, [
          receipt.hash,
          receipt.blockNumber,
          receipt.gasUsed.toString(),
          trade.id
        ]);
      }

      await client.query('COMMIT');
      console.log(`Updated ${trades.length} trades with execution status`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating trade execution status:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Update database with execution failure
   */
  async updateTradeExecutionFailure(trades, errorMessage) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const trade of trades) {
        await client.query(`
          UPDATE trades 
          SET 
            execution_status = 'FAILED',
            execution_error = $1,
            updated_at = NOW()
          WHERE id = $2
        `, [errorMessage, trade.id]);
      }

      await client.query('COMMIT');
      console.log(`Updated ${trades.length} trades with failure status`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating trade execution failure:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Get pending trades for execution
   */
  async getPendingTrades(limit = 50) {
    try {
      const result = await pool.query(`
        SELECT 
          t.*,
          bu.wallet_address as buyer_address,
          su.wallet_address as seller_address
        FROM trades t
        JOIN users bu ON t.buy_user_id = bu.id
        JOIN users su ON t.sell_user_id = su.id
        WHERE t.execution_status = 'PENDING'
        ORDER BY t.executed_at ASC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        id: row.id,
        buyOrderId: row.buy_order_id,
        sellOrderId: row.sell_order_id,
        price: parseFloat(row.price),
        quantity: parseFloat(row.quantity),
        buyUserId: row.buy_user_id,
        sellUserId: row.sell_user_id,
        buyerAddress: row.buyer_address,
        sellerAddress: row.seller_address,
        buyerAmount: parseFloat(row.price) * parseFloat(row.quantity),
        sellerAmount: parseFloat(row.price) * parseFloat(row.quantity),
        executedAt: row.executed_at
      }));

    } catch (error) {
      console.error('Error getting pending trades:', error);
      return [];
    }
  }

  /**
   * Process all pending trades
   */
  async processPendingTrades() {
    try {
      const pendingTrades = await this.getPendingTrades();
      
      if (pendingTrades.length === 0) {
        return { success: true, message: 'No pending trades', tradesProcessed: 0 };
      }

      console.log(`Processing ${pendingTrades.length} pending trades...`);

      // Check balances before execution
      const balanceChecks = await this.checkUserBalances(pendingTrades);
      const insufficientBalances = balanceChecks.filter(check => !check.sufficient);
      
      if (insufficientBalances.length > 0) {
        console.warn('Some users have insufficient balances:', insufficientBalances);
        // Could implement partial execution or skip problematic trades
      }

      // Execute trades in batches
      const batchSize = 20;
      const results = [];
      
      for (let i = 0; i < pendingTrades.length; i += batchSize) {
        const batch = pendingTrades.slice(i, i + batchSize);
        
        try {
          const result = await this.executeTradesOnContract(batch);
          results.push(result);
          
          // Wait a bit between batches to avoid network congestion
          if (i + batchSize < pendingTrades.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`Error executing batch ${i / batchSize + 1}:`, error);
          results.push({
            success: false,
            error: error.message,
            trades: batch.length
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const totalTrades = results.reduce((sum, r) => sum + r.trades, 0);

      return {
        success: successful > 0,
        message: `Processed ${totalTrades} trades, ${successful} batches successful`,
        tradesProcessed: totalTrades,
        successfulBatches: successful,
        totalBatches: results.length,
        results
      };

    } catch (error) {
      console.error('Error processing pending trades:', error);
      return {
        success: false,
        error: error.message,
        tradesProcessed: 0
      };
    }
  }

  /**
   * Get contract information
   */
  async getContractInfo() {
    if (!this.contract) {
      return { error: 'Contract not initialized' };
    }

    try {
      const [owner, treasury, transferFee, withdrawalFee, totalDeposited] = await Promise.all([
        this.contract.owner(),
        this.contract.treasury(),
        this.contract.transferFee(),
        this.contract.withdrawalFee(),
        this.contract.totalDeposited()
      ]);

      return {
        address: this.contractAddress,
        owner,
        treasury,
        transferFee: transferFee.toString(),
        withdrawalFee: withdrawalFee.toString(),
        totalDeposited: ethers.formatEther(totalDeposited),
        network: await this.provider.getNetwork()
      };

    } catch (error) {
      console.error('Error getting contract info:', error);
      return { error: error.message };
    }
  }

  /**
   * Health check for contract service
   */
  async healthCheck() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const contractInfo = await this.getContractInfo();

      return {
        status: 'healthy',
        network: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        contractAddress: this.contractAddress,
        contractInitialized: !!this.contract,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }
}

module.exports = new ContractExecutionService(); 