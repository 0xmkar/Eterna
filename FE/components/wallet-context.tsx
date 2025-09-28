"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { WalletState, WalletContextType } from "@/types/wallet"
import { useToast } from "@/hooks/use-toast"

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    allAccounts: [],
    selectedAccountIndex: 0,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          const balance = await window.ethereum.request({
            method: "eth_getBalance",
            params: [accounts[0], "latest"],
          })

          setWallet({
            isConnected: true,
            address: accounts[0],
            balance: (Number.parseInt(balance, 16) / 1e18).toFixed(4),
            chainId: Number.parseInt(chainId, 16),
            allAccounts: accounts,
            selectedAccountIndex: 0,
          })
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const getAllAccounts = async (): Promise<string[]> => {
    if (!window.ethereum) {
      return []
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      return accounts
    } catch (error) {
      console.error("Error getting accounts:", error)
      return []
    }
  }

  const switchAccount = async (index: number) => {
    if (!window.ethereum || index >= wallet.allAccounts.length || index < 0) {
      return
    }

    try {
      const selectedAddress = wallet.allAccounts[index]
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [selectedAddress, "latest"],
      })

      setWallet(prev => ({
        ...prev,
        address: selectedAddress,
        balance: (Number.parseInt(balance, 16) / 1e18).toFixed(4),
        selectedAccountIndex: index,
      }))

      toast({
        title: "Account switched",
        description: `Switched to account ${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-4)}`,
      })
    } catch (error) {
      console.error("Error switching account:", error)
      toast({
        title: "Switch failed",
        description: "Failed to switch account",
        variant: "destructive",
      })
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      const chainId = await window.ethereum.request({ method: "eth_chainId" })

      if (Number.parseInt(chainId, 16) !== 31) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1F" }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Chain not added, add it
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x1f",
                  chainName: "Rootstock Testnet", 
                  nativeCurrency: {
                    name: "rBTC",
                    symbol: "rBTC",
                    decimals: 18,
                  },
                  rpcUrls: ["https://public-node.testnet.rsk.co"],
                  blockExplorerUrls: ["https://rootstock-testnet.blockscout.com"],
                },
              ],
            })
          }
        }
      }

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })

      setWallet({
        isConnected: true,
        address: accounts[0],
        balance: (Number.parseInt(balance, 16) / 1e18).toFixed(4),
        chainId: Number.parseInt(chainId, 16),
        allAccounts: accounts,
        selectedAccountIndex: 0,
      })

      // Create or check user in backend
      try {
        // First check if user exists
        const userCheckResponse = await fetch(`http://localhost:3001/users/wallet/${accounts[0]}`)
        
        if (userCheckResponse.status === 404) {
          // User doesn't exist, create new user
          const createUserResponse = await fetch('http://localhost:3001/users', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wallet_address: accounts[0]
            })
          })

          if (createUserResponse.ok) {
            const userData = await createUserResponse.json()
            console.log('User created successfully:', userData.data)
          } else {
            console.error('Failed to create user:', await createUserResponse.json())
          }
        } else if (userCheckResponse.ok) {
          const userData = await userCheckResponse.json()
          console.log('Existing user found:', userData.data)
        }
      } catch (error) {
        console.error('Error handling user creation/check:', error)
        // Don't block wallet connection if user creation fails
      }

      toast({
        title: "Wallet connected",
        description: `Successfully connected to Rootstock testnet with ${accounts.length} account(s)`,
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      allAccounts: [],
      selectedAccountIndex: 0,
    })
    toast({
      title: "Wallet disconnected",
      description: "Successfully disconnected wallet",
    })
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        isConnecting,
        switchAccount,
        getAllAccounts,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
