import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, Users, Shield, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import LoanApprovalCard from '../loans/LoanApprovalCard';
import PortfolioLoanCard from '../loans/PortfolioLoanCard';
import AmountInput from '../AmountInput';
import { useWallet } from '../../hooks/useWallet';
import { useContracts } from '../../hooks/useContracts';

export default function LenderDashboard() {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'portfolio' | 'history'>('pending');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [lenderBalance, setLenderBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [portfolioLoans, setPortfolioLoans] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { isConnected, address } = useWallet();
  const { 
    deposit, 
    withdraw, 
    getLenderBalance, 
    getUSDCBalance, 
    mintTestUSDC, 
    getAllPendingLoans, 
    getLenderLoans,
    isReady 
  } = useContracts();

  // Calculate stats from actual portfolio
  const calculateStats = () => {
    let totalEarned = 0;
    let activeLoansCount = 0;
    let totalAPY = 0;
    let loanCount = 0;

    portfolioLoans.forEach(loan => {
      const principal = parseFloat(ethers.formatUnits(loan.principal, 6));
      const interestRate = Number(loan.interest) / 100;
      const totalLoanAmount = principal * (1 + interestRate / 100);
      const remainingAmount = parseFloat(ethers.formatUnits(loan.remainingBalance, 6));
      const paidAmount = totalLoanAmount - remainingAmount;

      if (loan.status === 1) { // Active
        activeLoansCount++;
        totalAPY += interestRate;
        loanCount++;
        // Calculate earned interest proportionally
        totalEarned += (totalLoanAmount - principal) * (paidAmount / totalLoanAmount);
      } else if (loan.status === 2) { // Completed
        // Full interest earned
        totalEarned += (totalLoanAmount - principal);
      }
    });

    const averageAPY = loanCount > 0 ? totalAPY / loanCount : 12.5;

    return {
      totalDeposited: parseFloat(lenderBalance),
      activeLoans: activeLoansCount,
      averageAPY: averageAPY,
      totalEarned: totalEarned
    };
  };

  const stats = calculateStats();

  const loadBalances = useCallback(async () => {
    if (!isConnected || !address || !isReady) {
      console.log('Cannot load balances - not ready:', { isConnected, address, isReady });
      return;
    }
    
    try {
      console.log('Loading balances...');
      const [lBalance, uBalance] = await Promise.all([
        getLenderBalance(),
        getUSDCBalance()
      ]);
      console.log('Balances loaded:', { lenderBalance: lBalance, usdcBalance: uBalance });
      setLenderBalance(lBalance);
      setUsdcBalance(uBalance);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  }, [isConnected, address, isReady, getLenderBalance, getUSDCBalance]);

  const loadAllLoans = useCallback(async () => {
    if (!isConnected || !address || !isReady) {
      console.log('Cannot load loans - not ready:', { isConnected, address, isReady });
      return;
    }
    
    try {
      console.log('Loading all loans...');
      const [pending, portfolio] = await Promise.all([
        getAllPendingLoans(),
        getLenderLoans()
      ]);
      console.log('Loans loaded:', { pending: pending.length, portfolio: portfolio.length });
      setPendingLoans(pending);
      setPortfolioLoans(portfolio);
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  }, [isConnected, address, isReady, getAllPendingLoans, getLenderLoans]);

  const loadAllData = useCallback(async () => {
    if (!isConnected || !address || !isReady) {
      console.log('Cannot load data - not ready');
      return;
    }
    
    console.log('Loading all lender data...');
    setIsLoadingLoans(true);
    try {
      await Promise.all([
        loadBalances(),
        loadAllLoans()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingLoans(false);
    }
  }, [isConnected, address, isReady, loadBalances, loadAllLoans]);

  // Initial load when contracts are ready
  useEffect(() => {
    console.log('Lender Dashboard - Ready state changed:', { isConnected, address, isReady });
    if (isConnected && address && isReady) {
      loadAllData();
    }
  }, [isConnected, address, isReady, loadAllData]);

  // Polling - refresh data every 15 seconds
  useEffect(() => {
    if (!isConnected || !address || !isReady) return;
    
    const interval = setInterval(() => {
      console.log('Polling lender data...');
      loadBalances();
      loadAllLoans();
    }, 15000);

    return () => clearInterval(interval);
  }, [isConnected, address, isReady, loadBalances, loadAllLoans]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsDepositing(true);
    setError(null);
    setSuccess(null);

    try {
      await deposit(depositAmount);
      setSuccess(`Successfully deposited ${depositAmount} USDC`);
      setDepositAmount('');
      await loadBalances();
    } catch (error: any) {
      setError(error.message || 'Failed to deposit');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsWithdrawing(true);
    setError(null);
    setSuccess(null);

    try {
      await withdraw(withdrawAmount);
      setSuccess(`Successfully withdrew ${withdrawAmount} USDC`);
      setWithdrawAmount('');
      await loadBalances();
    } catch (error: any) {
      setError(error.message || 'Failed to withdraw');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMintTestUSDC = async () => {
    setIsMinting(true);
    setError(null);
    setSuccess(null);

    try {
      await mintTestUSDC('1000');
      setSuccess('Successfully minted 1000 test USDC!');
      await loadBalances();
    } catch (error: any) {
      setError(error.message || 'Failed to mint test USDC');
    } finally {
      setIsMinting(false);
    }
  };

  const handleLoanFunded = () => {
    setSuccess('Loan funded successfully!');
    loadAllData();
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  // Get completed loans for history
  const completedLoans = portfolioLoans.filter(loan => loan.status === 2 || loan.status === 3);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Wallet Not Connected</h3>
          <p className="text-amber-700">Please connect your wallet to access the lender dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Lender Dashboard</h2>
        <p className="text-gray-600">Manage your lending portfolio and track returns</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
          {success}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Deposited</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${stats.totalDeposited.toFixed(2)}</div>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span>Wallet: ${parseFloat(usdcBalance).toFixed(2)} USDC</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Loans</span>
            <Users className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeLoans}</div>
          <div className="text-sm text-gray-600 mt-2">{pendingLoans.length} pending approval</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Average APY</span>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.averageAPY.toFixed(1)}%</div>
          <div className="flex items-center mt-2 text-sm text-amber-600">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>From active loans</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Earned</span>
            <Shield className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${stats.totalEarned.toFixed(2)}</div>
          <div className="text-sm text-gray-600 mt-2">Interest from loans</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center disabled:text-gray-400"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {/* Test USDC Mint for Development */}
        {parseFloat(usdcBalance) < 10 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-2">
              Need test USDC? Get some for testing on Base Sepolia.
            </p>
            <button
              onClick={handleMintTestUSDC}
              disabled={isMinting || !isConnected}
              className="px-4 py-2 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isMinting ? 'Minting...' : 'Mint 1000 Test USDC'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Funds
            </label>
            <div className="flex space-x-3">
              <AmountInput
                token="USDC"
                value={depositAmount}
                onChange={setDepositAmount}
                maxAmount={parseFloat(usdcBalance)}
              />
              <button 
                onClick={handleDeposit}
                disabled={isDepositing || !isConnected || parseFloat(usdcBalance) === 0}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDepositing ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdraw Funds
            </label>
            <div className="flex space-x-3">
              <AmountInput
                token="USDC"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                maxAmount={parseFloat(lenderBalance)}
              />
              <button 
                onClick={handleWithdraw}
                disabled={isWithdrawing || !isConnected || parseFloat(lenderBalance) === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Loans ({pendingLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'portfolio'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Portfolio ({portfolioLoans.filter(l => l.status === 1).length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History ({completedLoans.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'pending' && (
          <>
            {isLoadingLoans ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading pending loans...</p>
              </div>
            ) : pendingLoans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No pending loans available at the moment
              </div>
            ) : (
              pendingLoans.map(loan => (
                <LoanApprovalCard 
                  key={loan.id} 
                  loan={loan}
                  onSuccess={handleLoanFunded}
                />
              ))
            )}
          </>
        )}
        
        {activeTab === 'portfolio' && (
          <>
            {isLoadingLoans ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading portfolio...</p>
              </div>
            ) : portfolioLoans.filter(loan => loan.status === 1).length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No active loans in your portfolio yet. Browse pending loans to get started.
              </div>
            ) : (
              portfolioLoans
                .filter(loan => loan.status === 1)
                .map(loan => (
                  <PortfolioLoanCard key={loan.id} loan={loan} />
                ))
            )}
          </>
        )}
        
        {activeTab === 'history' && (
          <>
            {completedLoans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No completed loans yet
              </div>
            ) : (
              completedLoans.map(loan => (
                <PortfolioLoanCard key={loan.id} loan={loan} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
