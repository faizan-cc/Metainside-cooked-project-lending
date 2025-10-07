import React from 'react';
import { DollarSign, User, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { ethers } from 'ethers';
import ReputationBadge from '../ReputationBadge';
import ProgressRing from '../ProgressRing';

interface PortfolioLoanCardProps {
  loan: {
    id: string;
    borrower: string;
    principal: bigint;
    interest: bigint;
    duration: bigint;
    startTime: bigint;
    remainingBalance: bigint;
    status: number;
    borrowerReputation?: number;
  };
}

export default function PortfolioLoanCard({ loan }: PortfolioLoanCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

  const principalAmount = parseFloat(ethers.formatUnits(loan.principal, 6));
  const interestRate = Number(loan.interest) / 100;
  const durationMonths = Number(loan.duration) / (30 * 24 * 60 * 60);
  const totalLoanAmount = principalAmount * (1 + interestRate / 100);
  const remainingAmount = parseFloat(ethers.formatUnits(loan.remainingBalance, 6));
  const paidAmount = totalLoanAmount - remainingAmount;
  const progress = (paidAmount / totalLoanAmount) * 100;

  // Calculate earned interest
  const earnedInterest = loan.status === 2 ? (totalLoanAmount - principalAmount) : 
                        loan.status === 1 ? ((totalLoanAmount - principalAmount) * (paidAmount / totalLoanAmount)) : 0;

  const startDate = loan.startTime > 0 ? new Date(Number(loan.startTime) * 1000) : null;

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
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLoanStatusColor(loan.status)}`}>
            {getLoanStatusText(loan.status)}
          </span>
          {loan.borrowerReputation && (
            <ReputationBadge score={loan.borrowerReputation} size="sm" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Principal</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-4 w-4" />
            {principalAmount.toFixed(2)}
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
          <p className="text-sm text-gray-500">Earned Interest</p>
          <p className="font-semibold text-emerald-600">
            +${earnedInterest.toFixed(2)}
          </p>
        </div>
      </div>

      {startDate && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Started</p>
          <p className="text-sm font-medium text-gray-900 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {startDate.toLocaleDateString()}
          </p>
        </div>
      )}

      {loan.status === 1 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Repayment Progress</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              ${paidAmount.toFixed(2)} received
            </span>
            <span className="text-xs text-gray-500">
              ${remainingAmount.toFixed(2)} remaining
            </span>
          </div>
        </div>
      )}

      {loan.status === 2 && (
        <div className="bg-emerald-50 rounded-lg p-3 flex items-center">
          <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Loan Completed</p>
            <p className="text-xs text-emerald-600">
              Total return: ${totalLoanAmount.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
