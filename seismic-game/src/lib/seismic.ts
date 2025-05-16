/**
 * Seismic SDK for interacting with Seismic blockchain
 * This mock implementation simulates blockchain interactions
 * using localStorage for persistence
 */

interface GameData {
  player: Player;
  artifact: Artifact;
  achievements?: string[];
}

interface Player {
  x: number;
  y: number;
  direction: string;
  steps: number;
  movements: { x: number, y: number }[];
}

interface Artifact {
  x: number;
  y: number;
  found: boolean;
}

interface Transaction {
  type: string;
  data: any;
  timestamp: number;
  blockNumber?: number;
  confirmed?: boolean;
}

class SeismicSDK {
  private userName: string | null = null;
  private transactions: Transaction[] = [];
  private isDevnetConnected: boolean = false;
  private readonly STORAGE_KEY = 'seismic_game_data';
  private readonly TX_STORAGE_KEY = 'seismic_transactions';

  constructor() {
    this.loadTransactions();
  }

  /**
   * Initialize connection with username
   */
  public async connect(userName: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.userName = userName;
        localStorage.setItem('seismic_username', userName);
        this.isDevnetConnected = true;
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Disconnect user session
   */
  public disconnect(): void {
    this.userName = null;
    this.isDevnetConnected = false;
    localStorage.removeItem('seismic_username');
  }

  /**
   * Check if user is connected
   */
  public isConnected(): boolean {
    if (!this.userName) {
      const storedUsername = localStorage.getItem('seismic_username');
      if (storedUsername) {
        this.userName = storedUsername;
        this.isDevnetConnected = true;
        return true;
      }
      return false;
    }
    return this.isDevnetConnected;
  }

  /**
   * Get currently connected username
   */
  public getUsername(): string | null {
    return this.userName;
  }

  /**
   * Save game data to blockchain (simulated)
   */
  public async saveGameData(data: GameData): Promise<boolean> {
    if (!this.userName) return false;

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const storageKey = `${this.STORAGE_KEY}_${this.userName}`;
          localStorage.setItem(storageKey, JSON.stringify(data));
          
          // Log transaction
          this.logTransaction('SAVE_GAME_DATA', data);
          
          resolve(true);
        } catch (error) {
          console.error('Failed to save game data:', error);
          resolve(false);
        }
      }, 300); // Simulated blockchain delay
    });
  }

  /**
   * Get game data from blockchain (simulated)
   */
  public async getGameData(): Promise<GameData | null> {
    if (!this.userName) return null;

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const storageKey = `${this.STORAGE_KEY}_${this.userName}`;
          const data = localStorage.getItem(storageKey);
          
          if (data) {
            // Log transaction
            this.logTransaction('GET_GAME_DATA');
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Failed to get game data:', error);
          resolve(null);
        }
      }, 300); // Simulated blockchain delay
    });
  }

  /**
   * Log transaction to blockchain (simulated)
   */
  public logTransaction(type: string, data: any = {}): void {
    const transaction: Transaction = {
      type,
      data,
      timestamp: Date.now(),
    };

    // Add to transactions list
    this.transactions.push(transaction);
    
    // Simulate block confirmation after delay
    setTimeout(() => {
      const index = this.transactions.findIndex(
        (tx) => tx.timestamp === transaction.timestamp
      );
      
      if (index !== -1) {
        this.transactions[index].confirmed = true;
        this.transactions[index].blockNumber = Math.floor(Math.random() * 1000000) + 1;
        this.saveTransactions();
      }
    }, 2000);

    this.saveTransactions();
  }

  /**
   * Get all transactions
   */
  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  /**
   * Setup connection to Seismic Devnet
   */
  public async setupDevnetConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isDevnetConnected = true;
        resolve(true);
      }, 2000); // Simulate connection setup time
    });
  }

  /**
   * Check if Devnet is available
   */
  public async isDevnetAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  /**
   * Save transactions to localStorage
   */
  private saveTransactions(): void {
    try {
      localStorage.setItem(this.TX_STORAGE_KEY, JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Failed to save transactions:', error);
    }
  }

  /**
   * Load transactions from localStorage
   */
  private loadTransactions(): void {
    try {
      const transactions = localStorage.getItem(this.TX_STORAGE_KEY);
      if (transactions) {
        this.transactions = JSON.parse(transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }
}

// Export singleton instance
export const seismic = new SeismicSDK(); 