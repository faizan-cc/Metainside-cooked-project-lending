import React from 'react';
import { DollarSign } from 'lucide-react';

interface AmountInputProps {
  token: string;
  value: string;
  onChange: (value: string) => void;
  maxAmount?: number;
  error?: string;
}

export default function AmountInput({ token, value, onChange, maxAmount, error }: AmountInputProps) {
  const handleMax = () => {
    if (maxAmount) {
      onChange(maxAmount.toString());
    }
  };

  return (
    <div className="flex-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full pl-10 pr-20 py-2 border ${
            error ? 'border-rose-300' : 'border-gray-300'
          } rounded-md focus:ring-emerald-500 focus:border-emerald-500`}
          placeholder="0.00"
          step="0.01"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          <span className="text-gray-500">{token}</span>
          {maxAmount && (
            <button
              type="button"
              onClick={handleMax}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              MAX
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      {maxAmount && !error && (
        <p className="mt-1 text-sm text-gray-500">
          Available: ${maxAmount.toLocaleString()}
        </p>
      )}
    </div>
  );
}
