export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: WalletProvider
  }
}

export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  chainId: number | null
}

export interface WalletContextType {
  wallet: WalletState
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnecting: boolean
}

export interface ContractAddresses {
  marginVault: string
  treasury: string
  perpMarket: string
  blockSense: string
}

export const ROOTSTOCK_TESTNET_CONFIG = {
  chainId: 31,
  chainName: "Rootstock Testnet",
  nativeCurrency: {
    name: "rBTC",
    symbol: "rBTC",
    decimals: 18,
  },
  rpcUrls: ["https://public-node.testnet.rsk.co"],
  blockExplorerUrls: ["https://rootstock-testnet.blockscout.com"],
}