import React from 'react';
import { Clock, DollarSign, Calendar, User } from 'lucide-react';
import ReputationBadge from '../ReputationBadge';
import ProgressRing from '../ProgressRing';
import { Loan } from '../../types';

interface LoanCardProps {
  loan: Loan;
  showActions?: boolean;
  onMakePayment?: () => void;
  onViewDetails?: () => void;
}

export default function LoanCard({ loan, showActions = false, onMakePayment, onViewDetails }: LoanCardProps) {
  const getStatusColor = () => {
    switch (loan.status) {
      case 'active': return 'text-emerald-600 bg-emerald-100';
      case 'completed': return 'text-sky-600 bg-sky-100';
      case 'defaulted': return 'text-rose-600 bg-rose-100';
      case 'grace-period': return 'text-amber-600 bg-amber-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = () => {
    switch (loan.status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'defaulted': return 'Defaulted';
      case 'grace-period': return 'Grace Period';
      default: return 'Requested';
    }
  };

  const progress = ((loan.principal - loan.remainingBalance) / loan.principal) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{loan.borrowerName}</h3>
            <p className="text-sm text-gray-500">{loan.purpose}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="mb-4">
        <ReputationBadge score={loan.borrowerReputation} trend={loan.reputationTrend} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Principal</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-4 w-4" />
            {loan.principal.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Interest Rate</p>
          <p className="font-semibold text-gray-900">{loan.interestRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Duration</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {loan.duration} months
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Next Payment</p>
          <p className="font-semibold text-gray-900 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(loan.nextPaymentDue).toLocaleDateString()}
          </p>
        </div>
      </div>

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
            ${(loan.principal - loan.remainingBalance).toLocaleString()} paid
          </span>
          <span className="text-xs text-gray-500">
            ${loan.remainingBalance.toLocaleString()} remaining
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-3">
          <button
            onClick={onViewDetails}
            className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Details
          </button>
          {loan.status === 'active' && (
            <button
              onClick={onMakePayment}
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Make Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
