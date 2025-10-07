import React from 'react';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, error, chainId } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = chainId === 84532; // Base Sepolia

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        {!isCorrectNetwork && (
          <div className="flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            Wrong Network
          </div>
        )}
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md">
          <div className="h-2 w-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium text-gray-700">{formatAddress(address)}</span>
        </div>
        <button
          onClick={disconnect}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={connect}
        disabled={isConnecting}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-rose-50 border border-rose-200 rounded-md p-3 text-sm text-rose-700 max-w-xs">
          {error}
        </div>
      )}
    </>
  );
}
