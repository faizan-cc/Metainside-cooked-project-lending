import React from 'react';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReputationBadgeProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  loanCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ReputationBadge({ score, trend = 'stable', loanCount = 0, size = 'md' }: ReputationBadgeProps) {
  const getColorClass = () => {
    if (score >= 800) return 'text-emerald-600 bg-emerald-100';
    if (score >= 600) return 'text-sky-600 bg-sky-100';
    if (score >= 400) return 'text-amber-600 bg-amber-100';
    return 'text-rose-600 bg-rose-100';
  };

  const getBorderColor = () => {
    if (score >= 800) return 'border-emerald-200';
    if (score >= 600) return 'border-sky-200';
    if (score >= 400) return 'border-amber-200';
    return 'border-rose-200';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-emerald-600" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-rose-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${sizeClasses[size]} rounded-lg ${getColorClass()} border ${getBorderColor()}`}>
      <Shield className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />
      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          <span className={`font-bold ${textSizeClasses[size]}`}>{score}</span>
          {getTrendIcon()}
        </div>
        {loanCount > 0 && (
          <span className={`${textSizeClasses[size]} opacity-75`}>{loanCount} loans</span>
        )}
      </div>
    </div>
  );
}
