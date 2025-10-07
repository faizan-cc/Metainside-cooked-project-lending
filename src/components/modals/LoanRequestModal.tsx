import React, { useState } from 'react';
import { X, Info, AlertCircle } from 'lucide-react';
import AmountInput from '../AmountInput';
import { useContracts } from '../../hooks/useContracts';
import { useWallet } from '../../hooks/useWallet';

interface LoanRequestModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoanRequestModal({ onClose, onSuccess }: LoanRequestModalProps) {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('3');
  const [interestRate, setInterestRate] = useState('12');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected } = useWallet();
  const { requestLoan } = useContracts();

  const monthlyPayment = amount && duration && interestRate
    ? (Number(amount) * (1 + Number(interestRate) / 100)) / Number(duration)
    : 0;

  const handleSubmit = async () => {
    if (!amount || !purpose || !isConnected) {
      setError('Please fill in all fields and connect your wallet');
      return;
    }

    if (parseFloat(amount) < 10) {
      setError('Minimum loan amount is 10 USDC');
      return;
    }

    if (parseFloat(amount) > 1000) {
      setError('Maximum loan amount is 1000 USDC');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert duration from months to seconds (30 days per month)
      const durationInSeconds = Number(duration) * 30 * 24 * 60 * 60;
      // Convert interest rate from percentage to basis points (multiply by 100)
      const interestRateBps = Math.round(Number(interestRate) * 100);
      
      await requestLoan(amount, interestRateBps.toString(), durationInSeconds.toString());
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Loan request error:', err);
      if (err.message?.includes('Insufficient reputation')) {
        setError('Your reputation score is too low. You need at least 300 points to request a loan.');
      } else if (err.message?.includes('Too many active loans')) {
        setError('You have reached the maximum number of active loans (3).');
      } else {
        setError(err.message || 'Failed to submit loan request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Request New Loan</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-rose-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount
              </label>
              <AmountInput
                token="USDC"
                value={amount}
                onChange={setAmount}
                maxAmount={1000}
              />
              <p className="mt-1 text-xs text-gray-500">Min: 10 USDC, Max: 1000 USDC</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Duration (months)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Interest Rate (%)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="5"
                max="20"
                step="0.5"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Your reputation score suggests 10-15% range
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Purpose
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describe how you'll use this loan..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Info className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Loan Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Payment:</span>
                  <span className="font-medium">${monthlyPayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest:</span>
                  <span className="font-medium">
                    ${((Number(amount) * Number(interestRate)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Repayment:</span>
                  <span className="font-medium">
                    ${(Number(amount) * (1 + Number(interestRate) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
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
              disabled={!amount || !purpose || !isConnected || isSubmitting}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
