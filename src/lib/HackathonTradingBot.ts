import { 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  Asset,
  Account,
  Transaction,
  Horizon
} from "@stellar/stellar-sdk";

// Use Horizon.Server instead of importing StellarSdk default
const Server = Horizon.Server;

// Types
export interface TradingSignal {
  amount: number;
  price: number;
  confidence: number;
  asset?: string;
  direction?: 'buy' | 'sell';
}

export interface SetupResult {
  success: boolean;
  tradingAddress: string;
  userAddress: string;
  botPublicKey: string;
  message: string;
  demoBalance: string;
  createTxHash?: string;
  multisigTxHash?: string;
}

export interface TradeResult {
  success: boolean;
  transactionId?: string;
  fromAddress?: string;
  amount?: number;
  price?: number;
  message: string;
  ledger?: number;
  error?: string;
}

export interface AccountStatus {
  initialized: boolean;
  address?: string;
  balance?: string;
  signers?: Array<{
    key: string;
    weight: number;
  }>;
  thresholds?: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  error?: string;
}

// Stellar SDK tipler için interface'ler
interface Balance {
  asset_type: string;
  balance: string;
}

interface Signer {
  key: string;
  weight: number;
}

export class HackathonTradingBot {
  private botKeypair: Keypair;
  private tradingAccount: Account | null = null;
  private tradingAddress: string | null = null;
  private userKeypair: Keypair | null = null;
  private freighterPublicKey: string | null = null; // Freighter cüzdan adresi
  private server: Horizon.Server;
  
  // Configuration
  private readonly NETWORK = Networks.TESTNET;
  private readonly SERVER_URL = "https://horizon-testnet.stellar.org";
  private readonly DEFAULT_FEE = "100";
  private readonly TIMEOUT = 30;
  private readonly AUTO_APPROVE_LIMIT = 100; // XLM

  constructor(botSecretKey?: string) {
    if (botSecretKey) {
      this.botKeypair = Keypair.fromSecret(botSecretKey);
    } else {
      this.botKeypair = Keypair.random();
      console.log("🔑 Generated bot secret key:", this.botKeypair.secret());
    }
    
    this.server = new Server(this.SERVER_URL);
    
    console.log("🤖 Bot initialized with public key:", this.botKeypair.publicKey());
  }

  async setupForDemo(userKeypair: Keypair, freighterPublicKey?: string): Promise<SetupResult> {
    try {
      console.log("🚀 Setting up trading bot for hackathon demo...");
      
      this.userKeypair = userKeypair;
      this.freighterPublicKey = freighterPublicKey || null;
      
      console.log("👤 User keypair address:", userKeypair.publicKey());
      if (freighterPublicKey) {
        console.log("🌌 Freighter wallet address:", freighterPublicKey);
      }
      
      // 1. Generate trading account
      const tradingKeypair = Keypair.random();
      this.tradingAddress = tradingKeypair.publicKey();
      
      console.log("📍 Trading wallet address:", this.tradingAddress);
      console.log("👤 User main wallet:", userKeypair.publicKey());
      
      // 2. Validate user account (or create if not exists on testnet)
      let userAccount: Account & { balances: Balance[] }; // Stellar SDK'nın account response tipi
      try {
        userAccount = await this.server.loadAccount(userKeypair.publicKey()) as Account & { balances: Balance[] };
        const nativeBalance = userAccount.balances.find((b: Balance) => b.asset_type === 'native');
        console.log("✅ User account found, balance:", nativeBalance?.balance || '0');
        
        if (!nativeBalance || parseFloat(nativeBalance.balance) < 1100) {
          throw new Error("Insufficient balance. Need at least 1100 XLM for demo.");
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Not Found')) {
          // Testnet'te hesap bulunamadı, Friendbot ile oluşturalım
          console.log("🔄 Account not found on testnet, creating with Friendbot...");
          try {
            // Friendbot ile hesap oluştur ve fonla
            const friendbotUrl = `https://friendbot.stellar.org?addr=${encodeURIComponent(userKeypair.publicKey())}`;
            const response = await fetch(friendbotUrl);
            
            if (!response.ok) {
              throw new Error(`Friendbot failed: ${response.status}`);
            }
            
            console.log("✅ Account created and funded via Friendbot");
            
            // Hesabı tekrar yükle
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
            userAccount = await this.server.loadAccount(userKeypair.publicKey()) as Account & { balances: Balance[] };
            
            const nativeBalance = userAccount.balances.find((b: Balance) => b.asset_type === 'native');
            console.log("✅ New account balance:", nativeBalance?.balance || '0');
            
          } catch (friendbotError) {
            throw new Error(`Failed to create testnet account: ${friendbotError instanceof Error ? friendbotError.message : 'Unknown error'}`);
          }
        } else {
          throw new Error(`User account validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // 3. Create and fund trading account
      console.log("💰 Creating and funding trading account...");
      const createTransaction = new TransactionBuilder(userAccount, {
        fee: this.DEFAULT_FEE,
        networkPassphrase: this.NETWORK
      })
        .addOperation(Operation.createAccount({
          destination: this.tradingAddress,
          startingBalance: "1000"
        }))
        .setTimeout(this.TIMEOUT)
        .build();
      
      createTransaction.sign(userKeypair);
      const createResult = await this.server.submitTransaction(createTransaction);
      console.log("✅ Trading account created:", createResult.hash);
      
      // 4. Wait for account to be available
      await this.waitForAccount(this.tradingAddress);
      this.tradingAccount = await this.server.loadAccount(this.tradingAddress);
      
      // 5. Setup multisig
      console.log("🔐 Setting up multisig...");
      if (!this.tradingAccount) {
        throw new Error('Trading account not loaded');
      }
      
      const multisigTransaction = new TransactionBuilder(this.tradingAccount, {
        fee: this.DEFAULT_FEE,
        networkPassphrase: this.NETWORK
      })
        .addOperation(Operation.setOptions({
          signer: {
            ed25519PublicKey:this.botKeypair.publicKey(), 
            weight: 1
          }
        }))
        .addOperation(Operation.setOptions({
          signer: {
            ed25519PublicKey: userKeypair.publicKey(),
            weight: 1
          }
        }))
        .addOperation(Operation.setOptions({
          masterWeight: 0,
          lowThreshold: 2,
          medThreshold: 2,
          highThreshold: 2
        }))
        .setTimeout(this.TIMEOUT)
        .build();
      
      multisigTransaction.sign(tradingKeypair);
      const multisigResult = await this.server.submitTransaction(multisigTransaction);
      console.log("✅ Multisig setup complete:", multisigResult.hash);
      
      // 6. Reload account with updated signers
      this.tradingAccount = await this.server.loadAccount(this.tradingAddress);
      
      return {
        success: true,
        tradingAddress: this.tradingAddress,
        userAddress: userKeypair.publicKey(),
        botPublicKey: this.botKeypair.publicKey(),
        message: "✅ Trading bot ready! Your main funds are safe.",
        demoBalance: "1000 XLM in trading account",
        createTxHash: createResult.hash,
        multisigTxHash: multisigResult.hash
      };
      
    } catch (error: unknown) {
      console.error("❌ Setup failed:", error);
      throw new Error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeDemoTrade(signal: TradingSignal): Promise<TradeResult> {
    try {
      this.validateTradingState();
      this.validateSignal(signal);

      console.log("🤖 Bot executing trade automatically...");
      console.log("📍 Trading from address:", this.tradingAddress);
      console.log("📊 Signal:", signal);
      
      // Refresh account data
      console.log("🔄 Refreshing account data...");
      this.tradingAccount = await this.server.loadAccount(this.tradingAddress!);
      const accountWithBalances = this.tradingAccount as Account & { balances: Balance[] };
      console.log("✅ Account data refreshed, balance:", 
        accountWithBalances.balances.find((b: Balance) => b.asset_type === 'native')?.balance);
      
      // Build transaction
      console.log("🔨 Building transaction...");
      const transaction = this.buildTradeTransaction(signal);

      // Bot signs first (1/2)
      console.log("✍️ Bot signing transaction...");
      transaction.sign(this.botKeypair);
      console.log("✅ Bot signed the transaction");
      
      // Approval logic based on amount
      const tradeAmount = parseFloat(signal.amount.toString());
      
      if (tradeAmount > this.AUTO_APPROVE_LIMIT) {
        console.log("💬 Large trade detected, requesting user approval...");
        const approved = await this.requestUserApproval(transaction, signal);
        if (!approved) {
          throw new Error('Trade rejected by user');
        }
      } else {
        console.log("💰 Small trade, auto-approving...");
        if (!this.userKeypair) {
          throw new Error('User keypair not available for signing');
        }
        transaction.sign(this.userKeypair);
        console.log("✅ User signature added automatically");
      }
      
      // Submit transaction
      console.log("📤 Submitting transaction to Stellar network...");
      const result = await this.server.submitTransaction(transaction);
      
      console.log("✅ Trade executed successfully!");
      
      return {
        success: true,
        transactionId: result.hash,
        fromAddress: this.tradingAddress!,
        amount: signal.amount,
        price: signal.price,
        message: "✅ Trade executed with multisig security!",
        ledger: result.ledger
      };
      
    } catch (error: unknown) {
      console.error("❌ Trade execution failed:", error);
      
      // Extract more detailed error information
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a Stellar SDK error with more details
        if ('response' in error && error.response) {
          const response = error.response as { data?: { extras?: unknown; title?: string; detail?: string } };
          if (response.data && response.data.extras) {
            console.error("Stellar Error Details:", response.data.extras);
            errorMessage = `Stellar Error: ${response.data.title || response.data.detail || errorMessage}`;
          }
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        message: `❌ Trade failed: ${errorMessage}`
      };
    }
  }

  private buildTradeTransaction(signal: TradingSignal): Transaction {
    if (!this.tradingAccount) {
      throw new Error('Trading account not initialized');
    }

    // "Al" komutu: Trading hesabından kullanıcı hesabına XLM gönder
    // "Sat" komutu: Kullanıcı hesabından trading hesabına XLM gönder (simüle)
    const demoAmount = Math.min(signal.amount / 100, 5).toFixed(1); // Scale down for demo, max 5 XLM
    
    let destinationAddress: string;
    
    if (signal.direction === 'buy') {
      // "Al" komutu: Trading hesabından Freighter cüzdanına gönder
      if (this.freighterPublicKey) {
        destinationAddress = this.freighterPublicKey;
        console.log(`📤 AL işlemi: Trading hesabından Freighter cüzdanına ${demoAmount} XLM gönderiliyor`);
        console.log(`🎯 Hedef adres: ${destinationAddress}`);
      } else if (this.userKeypair) {
        destinationAddress = this.userKeypair.publicKey();
        console.log(`📤 AL işlemi: Trading hesabından user hesabına ${demoAmount} XLM gönderiliyor`);
      } else {
        throw new Error('No destination address available for buy operation');
      }
    } else {
      // "Sat" komutu: Kendine gönder (demo için)
      destinationAddress = this.tradingAccount.accountId();
      console.log(`📤 SAT işlemi: ${demoAmount} XLM işlemi simüle ediliyor`);
    }
    
    return new TransactionBuilder(this.tradingAccount, {
      fee: this.DEFAULT_FEE,
      networkPassphrase: this.NETWORK
    })
      .addOperation(Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount: demoAmount
      }))
      .setTimeout(this.TIMEOUT)
      .build();
  }

  private async requestUserApproval(transaction: Transaction, signal: TradingSignal): Promise<boolean> {
    console.log("🔔 Requesting user approval for trade:");
    console.log(`   Amount: ${signal.amount} XLM`);
    console.log(`   Price: ${signal.price} USDC/XLM`);
    console.log(`   From: ${this.tradingAddress}`);
    
    // In real implementation:
    // - Show browser popup
    // - Send Telegram notification  
    // - Notify frontend via WebSocket
    
    // Mock approval for demo
    const approved = true;
    
    if (approved) {
      console.log("✅ User approved the trade");
      transaction.sign(this.userKeypair!);
      return true;
    } else {
      console.log("❌ User rejected the trade");
      return false;
    }
  }

  async getAccountStatus(): Promise<AccountStatus> {
    if (!this.tradingAddress) {
      return { initialized: false };
    }

    try {
      const account = await this.server.loadAccount(this.tradingAddress);
      const nativeBalance = account.balances.find((b: Balance) => b.asset_type === 'native');
      
      return {
        initialized: true,
        address: this.tradingAddress,
        balance: nativeBalance?.balance || '0',
        signers: account.signers.map((s: Signer) => ({
          key: s.key,
          weight: s.weight
        })),
        thresholds: account.thresholds
      };
    } catch (error: unknown) {
      return {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getAddresses(): { userMainWallet?: string; tradingWallet?: string; botPublicKey: string; freighterWallet?: string } {
    return {
      userMainWallet: this.userKeypair?.publicKey(),
      tradingWallet: this.tradingAddress || undefined,
      botPublicKey: this.botKeypair.publicKey(),
      freighterWallet: this.freighterPublicKey || undefined
    };
  }

  // Private helper methods
  private validateTradingState(): void {
    if (!this.tradingAccount || !this.tradingAddress) {
      throw new Error('Trading bot not initialized. Call setupForDemo() first.');
    }
  }

  private validateSignal(signal: TradingSignal): void {
    if (!signal || typeof signal.amount !== 'number' || typeof signal.price !== 'number') {
      throw new Error('Invalid signal data: amount and price must be numbers');
    }
    
    if (signal.amount <= 0 || signal.price <= 0) {
      throw new Error('Invalid signal data: amount and price must be positive');
    }
  }

  private async waitForAccount(address: string, maxAttempts: number = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.server.loadAccount(address);
        return;
      } catch (error: unknown) {
        if (i === maxAttempts - 1) throw error;
        console.log(`⏳ Waiting for account ${address}... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  destroy(): void {
    this.tradingAccount = null;
    this.tradingAddress = null;
    this.userKeypair = null;
    console.log("🧹 Trading bot cleaned up");
  }
}

export default HackathonTradingBot;