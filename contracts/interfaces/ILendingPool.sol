// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILendingPool {
    struct Loan {
        uint256 id;
        address borrower;
        address lender;
        uint256 principal;
        uint256 interest;
        uint256 duration;
        uint256 startTime;
        uint256 nextPaymentDue;
        uint256 remainingBalance;
        LoanStatus status;
    }

    enum LoanStatus {
        Requested,
        Active,
        Completed,
        Defaulted,
        GracePeriod
    }

    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interest, uint256 duration);
    event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower);
    event PaymentMade(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanCompleted(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);

    function requestLoan(uint256 amount, uint256 interest, uint256 duration) external returns (uint256);
    function fundLoan(uint256 loanId) external;
    function makePayment(uint256 loanId, uint256 amount) external;
    function withdraw(uint256 amount) external;
}
