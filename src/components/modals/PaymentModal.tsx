import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import AmountInput from '../AmountInput';
import { useContracts } from '../../hooks/useContracts';
import { useWallet } from '../../hooks/useWallet';

interface PaymentModalProps {
  loanId: string;
  remainingBalance: bigint;
  monthlyPayment: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({ loanId, remainingBalance, monthlyPayment, onClose, onSuccess }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(monthlyPayment.toFixed(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
  const { makePayment, getUSDCBalance, mintTestUSDC } = useContracts();
  const { isConnected } = useWallet();

  useEffect(() => {
    if (isConnected) {
      loadUSDCBalance();
    }
  }, [isConnected]);

  const loadUSDCBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const balance = await getUSDCBalance();
      console.log('USDC Balance loaded:', balance);
      setUsdcBalance(balance);
    } catch (error) {
      console.error('Error loading USDC balance:', error);
      setUsdcBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const remainingBalanceFormatted = ethers.formatUnits(remainingBalance, 6);
  const maxPayment = Math.min(parseFloat(remainingBalanceFormatted), parseFloat(usdcBalance));

  const handleSubmit = async () => {
    setError(null);

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const paymentAmountNum = parseFloat(paymentAmount);
    const usdcBalanceNum = parseFloat(usdcBalance);
    const remainingBalanceNum = parseFloat(remainingBalanceFormatted);

    console.log('Payment validation:', {
      paymentAmount: paymentAmountNum,
      usdcBalance: usdcBalanceNum,
      remainingBalance: remainingBalanceNum
    });

    if (paymentAmountNum > remainingBalanceNum) {
      setError(`Payment exceeds remaining balance of $${remainingBalanceNum.toFixed(2)}`);
      return;
    }

    if (paymentAmountNum > usdcBalanceNum) {
      setError(`Insufficient USDC balance. You have $${usdcBalanceNum.toFixed(2)} USDC`);
      return;
    }

    setIsSubmitting(true);

    try {
      await makePayment(loanId, paymentAmount);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Payment error:', err);
      if (err.message?.includes('Insufficient balance')) {
        setError('Transaction failed: Insufficient USDC balance in wallet');
      } else if (err.message?.includes('user rejected')) {
        setError('Transaction cancelled by user');
      } else {
        setError(err.message || 'Failed to make payment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayFull = () => {
    setPaymentAmount(remainingBalanceFormatted);
  };

  const handleMintTestUSDC = async () => {
    try {
      setError(null);
      await mintTestUSDC('100');
      await loadUSDCBalance();
      setError('Successfully minted 100 test USDC!');
    } catch (err: any) {
      setError(err.message || 'Failed to mint test USDC');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Make Loan Payment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 ${error.includes('Successfully') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} border rounded-lg flex items-start`}>
              <AlertCircle className={`h-5 w-5 ${error.includes('Successfully') ? 'text-emerald-600' : 'text-rose-600'} mr-2 flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${error.includes('Successfully') ? 'text-emerald-700' : 'text-rose-700'}`}>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Loan Details</span>
                </div>
                <button
                  onClick={loadUSDCBalance}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                  disabled={isLoadingBalance}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan ID:</span>
                  <span className="font-medium">#{loanId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-medium">${remainingBalanceFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suggested Payment:</span>
                  <span className="font-medium">${monthlyPayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your USDC Balance:</span>
                  <span className="font-medium">
                    {isLoadingBalance ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      `$${parseFloat(usdcBalance).toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Show mint option if balance is low */}
            {parseFloat(usdcBalance) < parseFloat(paymentAmount) && parseFloat(usdcBalance) < 10 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 mb-2">
                  Need test USDC for payment?
                </p>
                <button
                  type="button"
                  onClick={handleMintTestUSDC}
                  className="text-sm bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                >
                  Mint 100 Test USDC
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <AmountInput
                token="USDC"
                value={paymentAmount}
                onChange={setPaymentAmount}
                maxAmount={maxPayment}
              />
              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(monthlyPayment.toFixed(2))}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Pay Monthly Amount
                </button>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Pay Full Balance
                </button>
              </div>
            </div>

            {parseFloat(paymentAmount) === parseFloat(remainingBalanceFormatted) && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  🎉 This payment will complete your loan!
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!paymentAmount || isSubmitting || parseFloat(paymentAmount) <= 0 || isLoadingBalance}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Make Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
