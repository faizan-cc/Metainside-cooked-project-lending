import React, { useState } from 'react';
import { DollarSign, User, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { ethers } from 'ethers';
import ReputationBadge from '../ReputationBadge';
import { useContracts } from '../../hooks/useContracts';

interface LoanApprovalCardProps {
  loan: {
    id: string;
    borrower: string;
    principal: bigint;
    interest: bigint;
    duration: bigint;
    borrowerReputation?: number;
  };
  onSuccess?: () => void;
}

export default function LoanApprovalCard({ loan, onSuccess }: LoanApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fundLoan } = useContracts();

  const handleApproveLoan = async () => {
    setIsApproving(true);
    setError(null);

    try {
      await fundLoan(loan.id);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error funding loan:', err);
      setError(err.message || 'Failed to fund loan');
    } finally {
      setIsApproving(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const principalAmount = ethers.formatUnits(loan.principal, 6);
  const interestRate = Number(loan.interest) / 100;
  const durationMonths = Number(loan.duration) / (30 * 24 * 60 * 60);
  const totalRepayment = Number(principalAmount) * (1 + interestRate / 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{formatAddress(loan.borrower)}</p>
            <p className="text-sm text-gray-500">Loan #{loan.id}</p>
          </div>
        </div>
        {loan.borrowerReputation && (
          <ReputationBadge score={loan.borrowerReputation} size="sm" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Amount Requested</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-4 w-4" />
            {principalAmount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Interest Rate</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            {interestRate}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Duration</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {Math.round(durationMonths)} months
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Return</p>
          <p className="font-semibold text-emerald-600">
            ${totalRepayment.toFixed(2)}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        onClick={handleApproveLoan}
        disabled={isApproving}
        className="w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isApproving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Funding Loan...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Fund Loan
          </>
        )}
      </button>
    </div>
  );
}
