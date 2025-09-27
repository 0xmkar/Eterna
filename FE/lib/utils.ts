import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {ethers} from 'ethers'
import DDexRBTCABI from "@/abi/DDexRBTC.json"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CONTRACT_ADDRESS = "0x5c145e59Cf7dfa07b30Da1f25603229982438d72"

export const createContractInstance = async () => {
  // Check if wallet is connected
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install MetaMask or another Web3 wallet.");
  }

  // Request account access if needed
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (accounts.length === 0) {
    throw new Error("No wallet connected. Please connect your wallet first.");
  }

  // Create provider using ethers v6 syntax
  const provider = new ethers.BrowserProvider(window.ethereum);

  // Get signer (connected wallet)
  const signer = await provider.getSigner();
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, DDexRBTCABI.abi, signer);
  
  return contract;
};
