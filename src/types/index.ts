export interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  borrowerReputation: number;
  reputationTrend?: 'up' | 'down' | 'stable';
  lenderId?: string;
  lenderName?: string;
  principal: number;
  interestRate: number;
  duration: number;
  startTime?: Date;
  nextPaymentDue: Date;
  remainingBalance: number;
  status: 'requested' | 'active' | 'completed' | 'defaulted' | 'grace-period';
  purpose: string;
}

export interface User {
  address: string;
  reputation: number;
  totalLoans: number;
  successfulLoans: number;
  defaultedLoans: number;
}
