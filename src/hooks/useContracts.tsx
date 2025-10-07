import { useEffect, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// ABIs for the contracts
const LENDING_POOL_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function lenderBalances(address) view returns (uint256)",
  "function requestLoan(uint256 amount, uint256 interestRate, uint256 duration) external returns (uint256)",
  "function fundLoan(uint256 loanId) external",
  "function makePayment(uint256 loanId, uint256 amount) external",
  "function loans(uint256) view returns (tuple(uint256 id, address borrower, address lender, uint256 principal, uint256 interest, uint256 duration, uint256 startTime, uint256 nextPaymentDue, uint256 remainingBalance, uint8 status))",
  "function getLoansByBorrower(address borrower) view returns (uint256[])",
  "function getLoansByLender(address lender) view returns (uint256[])",
  "function borrowerActiveLoans(address) view returns (uint256)",
  "function totalLoans() view returns (uint256)",
  "event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interest, uint256 duration)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower)",
  "event PaymentMade(uint256 indexed loanId, address indexed borrower, uint256 amount)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) external"
];

const REPUTATION_ORACLE_ABI = [
  "function getReputation(address user) view returns (uint256)",
  "function initializeReputation(address user) external",
  "function reputations(address) view returns (uint256 score, uint256 totalLoans, uint256 successfulLoans, uint256 defaultedLoans, uint256 lastUpdate)"
];

// Helper to parse loan struct from contract
const parseLoan = (loanData: any, id: string) => {
  return {
    id: id,
    borrower: loanData[1],
    lender: loanData[2],
    principal: loanData[3],
    interest: loanData[4],
    duration: loanData[5],
    startTime: loanData[6],
    nextPaymentDue: loanData[7],
    remainingBalance: loanData[8],
    status: Number(loanData[9])
  };
};

export function useContracts() {
  const { provider, signer, address } = useWallet();
  const [isReady, setIsReady] = useState(false);

  // Use useMemo to create contract instances only when provider/signer changes
  const contracts = useMemo(() => {
    if (!provider || !signer) {
      console.log('Contracts not ready: missing provider or signer');
      return { lendingPool: null, usdc: null, reputationOracle: null };
    }

    console.log('Initializing contracts...');
    
    const lendingPoolContract = new ethers.Contract(
      CONTRACT_ADDRESSES.lendingPool,
      LENDING_POOL_ABI,
      signer
    );
    
    const usdcContract = new ethers.Contract(
      CONTRACT_ADDRESSES.usdc,
      ERC20_ABI,
      signer
    );
    
    const reputationOracleContract = new ethers.Contract(
      CONTRACT_ADDRESSES.reputationOracle,
      REPUTATION_ORACLE_ABI,
      signer
    );

    return {
      lendingPool: lendingPoolContract,
      usdc: usdcContract,
      reputationOracle: reputationOracleContract
    };
  }, [provider, signer]);

  // Set ready state when contracts are initialized
  useEffect(() => {
    if (contracts.lendingPool && contracts.usdc && contracts.reputationOracle) {
      console.log('Contracts are ready');
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [contracts]);

  const deposit = async (amount: string) => {
    if (!contracts.lendingPool || !contracts.usdc || !address) {
      throw new Error('Contracts not initialized');
    }

    try {
      const decimals = await contracts.usdc.decimals();
      const amountInDecimals = ethers.parseUnits(amount, decimals);

      const currentAllowance = await contracts.usdc.allowance(address, CONTRACT_ADDRESSES.lendingPool);
      
      if (currentAllowance < amountInDecimals) {
        const approveTx = await contracts.usdc.approve(CONTRACT_ADDRESSES.lendingPool, amountInDecimals);
        await approveTx.wait();
      }

      const depositTx = await contracts.lendingPool.deposit(amountInDecimals);
      await depositTx.wait();

      return depositTx;
    } catch (error: any) {
      console.error('Deposit error:', error);
      throw error;
    }
  };

  const withdraw = async (amount: string) => {
    if (!contracts.lendingPool || !contracts.usdc) {
      throw new Error('Contracts not initialized');
    }

    try {
      const decimals = await contracts.usdc.decimals();
      const amountInDecimals = ethers.parseUnits(amount, decimals);

      const withdrawTx = await contracts.lendingPool.withdraw(amountInDecimals);
      await withdrawTx.wait();

      return withdrawTx;
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    }
  };

  const requestLoan = async (amount: string, interestRate: string, duration: string) => {
    if (!contracts.lendingPool || !address) {
      throw new Error('Contracts not initialized');
    }

    try {
      const amountInDecimals = ethers.parseUnits(amount, 6);

      const requestTx = await contracts.lendingPool.requestLoan(
        amountInDecimals,
        interestRate,
        duration
      );
      await requestTx.wait();

      return requestTx;
    } catch (error: any) {
      console.error('Request loan error:', error);
      throw error;
    }
  };

  const fundLoan = async (loanId: string) => {
    if (!contracts.lendingPool) {
      throw new Error('Contracts not initialized');
    }

    try {
      const fundTx = await contracts.lendingPool.fundLoan(loanId);
      await fundTx.wait();
      return fundTx;
    } catch (error: any) {
      console.error('Fund loan error:', error);
      throw error;
    }
  };

  const makePayment = async (loanId: string, amount: string) => {
    if (!contracts.lendingPool || !contracts.usdc || !address) {
      throw new Error('Contracts not initialized');
    }

    try {
      const amountInDecimals = ethers.parseUnits(amount, 6);

      // Check and approve USDC if needed
      const currentAllowance = await contracts.usdc.allowance(address, CONTRACT_ADDRESSES.lendingPool);
      
      if (currentAllowance < amountInDecimals) {
        const approveTx = await contracts.usdc.approve(CONTRACT_ADDRESSES.lendingPool, amountInDecimals);
        await approveTx.wait();
      }

      // Make the payment
      const paymentTx = await contracts.lendingPool.makePayment(loanId, amountInDecimals);
      await paymentTx.wait();

      return paymentTx;
    } catch (error: any) {
      console.error('Payment error:', error);
      throw error;
    }
  };

  const getLenderBalance = async () => {
    if (!contracts.lendingPool || !address || !isReady) {
      console.log('Cannot get lender balance: contracts not ready');
      return '0';
    }
    
    try {
      console.log('Getting lender balance for:', address);
      const balance = await contracts.lendingPool.lenderBalances(address);
      const formatted = ethers.formatUnits(balance, 6);
      console.log('Lender balance:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error getting lender balance:', error);
      return '0';
    }
  };

  const getUSDCBalance = async () => {
    if (!contracts.usdc || !address || !isReady) {
      console.log('Cannot get USDC balance: contracts not ready');
      return '0';
    }
    
    try {
      console.log('Getting USDC balance for:', address);
      const balance = await contracts.usdc.balanceOf(address);
      const formatted = ethers.formatUnits(balance, 6);
      console.log('USDC balance:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return '0';
    }
  };

  const getReputation = async (userAddress?: string) => {
    if (!contracts.reputationOracle || !isReady) {
      console.log('Cannot get reputation: contracts not ready');
      return 500;
    }
    
    try {
      const targetAddress = userAddress || address;
      if (!targetAddress) return 500;
      
      console.log('Getting reputation for:', targetAddress);
      const reputation = await contracts.reputationOracle.getReputation(targetAddress);
      const rep = Number(reputation);
      console.log('Reputation:', rep);
      return rep;
    } catch (error) {
      console.error('Error getting reputation:', error);
      return 500;
    }
  };

  const getBorrowerActiveLoans = async () => {
    if (!contracts.lendingPool || !address || !isReady) {
      console.log('Cannot get active loans: contracts not ready');
      return 0;
    }
    
    try {
      console.log('Getting active loans for borrower:', address);
      const activeLoans = await contracts.lendingPool.borrowerActiveLoans(address);
      const count = Number(activeLoans);
      console.log('Active loans count:', count);
      return count;
    } catch (error) {
      console.error('Error getting active loans:', error);
      return 0;
    }
  };

  const getBorrowerLoans = async () => {
    if (!contracts.lendingPool || !address || !isReady) {
      console.log('Cannot get borrower loans: contracts not ready');
      return [];
    }
    
    try {
      console.log('Getting all loans for borrower:', address);
      const loanIds = await contracts.lendingPool.getLoansByBorrower(address);
      console.log('Loan IDs:', loanIds);
      const loans = [];
      
      for (const loanId of loanIds) {
        const loanData = await contracts.lendingPool.loans(loanId);
        loans.push(parseLoan(loanData, loanId.toString()));
      }
      
      console.log('Parsed loans:', loans);
      return loans;
    } catch (error) {
      console.error('Error getting borrower loans:', error);
      return [];
    }
  };

  const getLenderLoans = async () => {
    if (!contracts.lendingPool || !address || !isReady) {
      console.log('Cannot get lender loans: contracts not ready');
      return [];
    }
    
    try {
      console.log('Getting all loans for lender:', address);
      const loanIds = await contracts.lendingPool.getLoansByLender(address);
      console.log('Lender loan IDs:', loanIds);
      const loans = [];
      
      for (const loanId of loanIds) {
        const loanData = await contracts.lendingPool.loans(loanId);
        const loan = parseLoan(loanData, loanId.toString());
        
        // Get borrower reputation
        const reputation = await getReputation(loan.borrower);
        loans.push({ ...loan, borrowerReputation: reputation });
      }
      
      console.log('Parsed lender loans:', loans);
      return loans;
    } catch (error) {
      console.error('Error getting lender loans:', error);
      return [];
    }
  };

  const getLoanById = async (loanId: string) => {
    if (!contracts.lendingPool || !isReady) return null;
    
    try {
      const loanData = await contracts.lendingPool.loans(loanId);
      return parseLoan(loanData, loanId);
    } catch (error) {
      console.error('Error getting loan by id:', error);
      return null;
    }
  };

  const getAllPendingLoans = async () => {
    if (!contracts.lendingPool || !isReady) {
      console.log('Cannot get pending loans: contracts not ready');
      return [];
    }
    
    try {
      console.log('Getting all pending loans...');
      const totalLoans = await contracts.lendingPool.totalLoans();
      console.log('Total loans in system:', Number(totalLoans));
      const pendingLoans = [];
      
      for (let i = 0; i < Number(totalLoans); i++) {
        const loanData = await contracts.lendingPool.loans(i);
        const loan = parseLoan(loanData, i.toString());
        
        // Status 0 means "Requested" (pending)
        if (loan.status === 0) {
          // Get borrower reputation
          const reputation = await getReputation(loan.borrower);
          pendingLoans.push({ ...loan, borrowerReputation: reputation });
        }
      }
      
      console.log('Pending loans:', pendingLoans);
      return pendingLoans;
    } catch (error) {
      console.error('Error getting pending loans:', error);
      return [];
    }
  };

  const mintTestUSDC = async (amount: string) => {
    if (!contracts.usdc || !address) {
      throw new Error('Contracts not initialized');
    }

    try {
      const decimals = await contracts.usdc.decimals();
      const amountInDecimals = ethers.parseUnits(amount, decimals);

      const mintTx = await contracts.usdc.mint(address, amountInDecimals);
      await mintTx.wait();

      return mintTx;
    } catch (error) {
      console.error('Mint error:', error);
      throw error;
    }
  };

  return {
    lendingPool: contracts.lendingPool,
    usdc: contracts.usdc,
    reputationOracle: contracts.reputationOracle,
    isReady,
    deposit,
    withdraw,
    requestLoan,
    fundLoan,
    makePayment,
    getLenderBalance,
    getUSDCBalance,
    getReputation,
    getBorrowerActiveLoans,
    getBorrowerLoans,
    getLenderLoans,
    getLoanById,
    getAllPendingLoans,
    mintTestUSDC
  };
}
