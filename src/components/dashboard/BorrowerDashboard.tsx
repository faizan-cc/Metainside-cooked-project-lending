import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Clock, TrendingUp, FileText, Plus, RefreshCw, CreditCard } from 'lucide-react';
import { ethers } from 'ethers';
import LoanCard from '../loans/LoanCard';
import ReputationBadge from '../ReputationBadge';
import LoanRequestModal from '../modals/LoanRequestModal';
import PaymentModal from '../modals/PaymentModal';
import { useWallet } from '../../hooks/useWallet';
import { useContracts } from '../../hooks/useContracts';

export default function BorrowerDashboard() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<any>(null);
  const [reputation, setReputation] = useState(500);
  const [activeLoansCount, setActiveLoansCount] = useState(0);
  const [borrowerLoans, setBorrowerLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { isConnected, address } = useWallet();
  const { getReputation, getBorrowerActiveLoans, getBorrowerLoans, isReady } = useContracts();

  // Calculate stats from loans
  const calculateStats = () => {
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let nextPaymentAmount = 0;
    let earliestPaymentDue = null;

    borrowerLoans.forEach(loan => {
      const principal = parseFloat(ethers.formatUnits(loan.principal, 6));
      totalBorrowed += principal;

      // Calculate total repaid (principal - remaining balance)
      const totalLoanAmount = principal * (1 + Number(loan.interest) / 10000);
      const remaining = parseFloat(ethers.formatUnits(loan.remainingBalance, 6));
      const repaid = totalLoanAmount - remaining;
      if (repaid > 0) totalRepaid += repaid;

      // Find next payment for active loans
      if (loan.status === 1 && loan.nextPaymentDue > 0) { // Active status
        const paymentDue = new Date(Number(loan.nextPaymentDue) * 1000);
        const monthlyPayment = totalLoanAmount / (Number(loan.duration) / (30 * 24 * 60 * 60));
        
        if (!earliestPaymentDue || paymentDue < earliestPaymentDue) {
          earliestPaymentDue = paymentDue;
          nextPaymentAmount = monthlyPayment;
        }
      }
    });

    return {
      reputation,
      activeLoans: activeLoansCount,
      totalBorrowed,
      totalRepaid,
      nextPaymentAmount,
      nextPaymentDate: earliestPaymentDue || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  };

  const borrowerStats = calculateStats();

  const loadBorrowerData = useCallback(async () => {
    if (!isConnected || !address || !isReady) {
      console.log('Cannot load borrower data - not ready:', { isConnected, address, isReady });
      return;
    }
    
    console.log('Loading borrower data...');
    setIsLoading(true);
    try {
      const [rep, activeLoans, loans] = await Promise.all([
        getReputation(),
        getBorrowerActiveLoans(),
        getBorrowerLoans()
      ]);
      
      console.log('Borrower data loaded:', { reputation: rep, activeLoans, loansCount: loans.length });
      setReputation(rep);
      setActiveLoansCount(activeLoans);
      setBorrowerLoans(loans);
    } catch (error) {
      console.error('Error loading borrower data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, isReady, getReputation, getBorrowerActiveLoans, getBorrowerLoans]);

  // Initial load when contracts are ready
  useEffect(() => {
    console.log('Borrower Dashboard - Ready state changed:', { isConnected, address, isReady });
    if (isConnected && address && isReady) {
      loadBorrowerData();
    }
  }, [isConnected, address, isReady, loadBorrowerData]);

  // Polling - refresh data every 15 seconds
  useEffect(() => {
    if (!isConnected || !address || !isReady) return;
    
    const interval = setInterval(() => {
      console.log('Polling borrower data...');
      loadBorrowerData();
    }, 15000);

    return () => clearInterval(interval);
  }, [isConnected, address, isReady, loadBorrowerData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBorrowerData();
    setIsRefreshing(false);
  };

  const handleLoanRequestSuccess = () => {
    setSuccess('Loan request submitted successfully!');
    loadBorrowerData();
    setTimeout(() => setSuccess(null), 5000);
  };

  const handlePaymentSuccess = () => {
    setSuccess('Payment made successfully!');
    loadBorrowerData();
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleMakePayment = (loan: any) => {
    const principal = parseFloat(ethers.formatUnits(loan.principal, 6));
    const totalAmount = principal * (1 + Number(loan.interest) / 10000);
    const monthlyPayment = totalAmount / (Number(loan.duration) / (30 * 24 * 60 * 60));
    
    setSelectedLoanForPayment({
      ...loan,
      monthlyPayment
    });
    setShowPaymentModal(true);
  };

  const getLoanStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Requested';
      case 1: return 'Active';
      case 2: return 'Completed';
      case 3: return 'Defaulted';
      case 4: return 'Grace Period';
      default: return 'Unknown';
    }
  };

  const getLoanStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-gray-100 text-gray-800';
      case 1: return 'bg-emerald-100 text-emerald-800';
      case 2: return 'bg-sky-100 text-sky-800';
      case 3: return 'bg-rose-100 text-rose-800';
      case 4: return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (value: any): string => {
    try {
      if (!value || value === '0x0' || value === 0n) return '0';
      return ethers.formatUnits(value.toString(), 6);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0';
    }
  };

  const formatDuration = (value: any): string => {
    try {
      if (!value || value === '0x0' || value === 0n) return '0';
      const seconds = Number(value.toString());
      const months = Math.round(seconds / (30 * 24 * 60 * 60));
      return months.toString();
    } catch (error) {
      console.error('Error formatting duration:', error);
      return '0';
    }
  };

  const formatInterestRate = (value: any): string => {
    try {
      if (!value || value === '0x0' || value === 0n) return '0';
      return (Number(value.toString()) / 100).toString();
    } catch (error) {
      console.error('Error formatting interest rate:', error);
      return '0';
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Wallet Not Connected</h3>
          <p className="text-amber-700">Please connect your wallet to access the borrower dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Borrower Dashboard</h2>
            <p className="text-gray-600">Manage your loans and build your reputation</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center disabled:text-gray-400"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              disabled={!isConnected || activeLoansCount >= 3}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request New Loan
            </button>
          </div>
        </div>
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

      {/* Reputation and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500 block mb-2">Your Reputation</span>
            <ReputationBadge 
              score={borrowerStats.reputation} 
              trend="stable" 
              loanCount={borrowerStats.totalBorrowed > 0 ? borrowerLoans.length : 0}
              size="lg"
            />
          </div>
          <p className="text-xs text-gray-600">
            {reputation < 300 
              ? 'Build your reputation by completing successful loans'
              : 'Keep making timely payments to improve your score'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Loans</span>
            <FileText className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{borrowerStats.activeLoans}</div>
          <div className="text-sm text-gray-600 mt-2">
            {3 - borrowerStats.activeLoans} slots available
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Borrowed</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${borrowerStats.totalBorrowed.toFixed(2)}</div>
          <div className="text-sm text-emerald-600 mt-2">
            ${borrowerStats.totalRepaid.toFixed(2)} repaid
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Next Payment</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {borrowerStats.nextPaymentAmount > 0 ? `$${borrowerStats.nextPaymentAmount.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-sm text-amber-600 mt-2">
            {borrowerStats.nextPaymentAmount > 0 
              ? `Due ${borrowerStats.nextPaymentDate.toLocaleDateString()}`
              : 'No payments due'}
          </div>
        </div>
      </div>

      {/* Eligibility Check */}
      {reputation < 300 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-amber-800 mb-1">Reputation Too Low</h3>
          <p className="text-sm text-amber-700">
            You need a reputation score of at least 300 to request loans. Build your reputation by completing microloans or verified activities.
          </p>
        </div>
      )}

      {activeLoansCount >= 3 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-rose-800 mb-1">Loan Limit Reached</h3>
          <p className="text-sm text-rose-700">
            You have reached the maximum of 3 active loans. Please repay existing loans before requesting new ones.
          </p>
        </div>
      )}

      {/* Payment Schedule */}
      {borrowerLoans.filter(loan => loan.status === 1).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payments</h3>
          <div className="space-y-3">
            {borrowerLoans.filter(loan => loan.status === 1).map(loan => {
              const principal = parseFloat(ethers.formatUnits(loan.principal, 6));
              const totalAmount = principal * (1 + Number(loan.interest) / 10000);
              const monthlyPayment = totalAmount / (Number(loan.duration) / (30 * 24 * 60 * 60));
              const nextPaymentDate = loan.nextPaymentDue > 0 ? new Date(Number(loan.nextPaymentDue) * 1000) : null;
              
              return (
                <div key={loan.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Loan #{loan.id}</p>
                    {nextPaymentDate && (
                      <p className="text-sm text-gray-600">Due {nextPaymentDate.toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${monthlyPayment.toFixed(2)}</p>
                    <button 
                      onClick={() => handleMakePayment(loan)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Loans */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Loans</h3>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading loans...</p>
          </div>
        ) : borrowerLoans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No loans yet. Request your first loan to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {borrowerLoans.map(loan => {
              const statusNum = typeof loan.status === 'bigint' ? Number(loan.status) : loan.status;
              const principal = parseFloat(formatAmount(loan.principal));
              const totalAmount = principal * (1 + Number(loan.interest) / 10000);
              const monthlyPayment = totalAmount / (Number(loan.duration) / (30 * 24 * 60 * 60));
              
              return (
                <div key={loan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Loan ID</p>
                      <p className="font-semibold">#{loan.id}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLoanStatusColor(statusNum)}`}>
                      {getLoanStatusText(statusNum)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Amount</span>
                      <span className="font-medium">${principal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Interest</span>
                      <span className="font-medium">{formatInterestRate(loan.interest)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="font-medium">{formatDuration(loan.duration)} months</span>
                    </div>
                    {loan.remainingBalance && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Remaining</span>
                        <span className="font-medium">${formatAmount(loan.remainingBalance)}</span>
                      </div>
                    )}
                  </div>
                  {statusNum === 1 && (
                    <button
                      onClick={() => handleMakePayment(loan)}
                      className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 flex items-center justify-center"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showRequestModal && (
        <LoanRequestModal 
          onClose={() => setShowRequestModal(false)} 
          onSuccess={handleLoanRequestSuccess}
        />
      )}

      {showPaymentModal && selectedLoanForPayment && (
        <PaymentModal
          loanId={selectedLoanForPayment.id}
          remainingBalance={selectedLoanForPayment.remainingBalance}
          monthlyPayment={selectedLoanForPayment.monthlyPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedLoanForPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
