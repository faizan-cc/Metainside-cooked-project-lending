// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ILendingPool.sol";
import "./ReputationOracleByMetaInside.sol";

contract LendingPoolByMetaInside is ILendingPool, ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    IERC20 public immutable stablecoin;
    ReputationOracleByMetaInside public immutable reputationOracle;
    
    uint256 public constant MIN_LOAN_AMOUNT = 10e6; // 10 USDC
    uint256 public constant MAX_LOAN_AMOUNT = 1000e6; // 1000 USDC
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 public constant PROTOCOL_FEE = 100; // 1%
    uint256 public constant FEE_DENOMINATOR = 10000;

    uint256 public totalLoans;
    uint256 public totalValueLocked;
    uint256 public totalDefaulted;
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;
    mapping(address => uint256) public lenderBalances;
    mapping(address => uint256) public borrowerActiveLoans;

    modifier onlyEligibleBorrower() {
        require(reputationOracle.getReputation(msg.sender) >= 300, "Insufficient reputation");
        require(borrowerActiveLoans[msg.sender] < 3, "Too many active loans");
        _;
    }

    constructor(address _stablecoin, address _reputationOracle) {
        stablecoin = IERC20(_stablecoin);
        reputationOracle = ReputationOracleByMetaInside(_reputationOracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, msg.sender);
    }

    function requestLoan(
        uint256 amount,
        uint256 interestRate,
        uint256 duration
    ) external whenNotPaused onlyEligibleBorrower returns (uint256) {
        require(amount >= MIN_LOAN_AMOUNT && amount <= MAX_LOAN_AMOUNT, "Invalid amount");
        require(interestRate <= 2000, "Interest rate too high"); // Max 20%
        require(duration >= 30 days && duration <= 365 days, "Invalid duration");

        uint256 loanId = totalLoans++;
        
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            lender: address(0),
            principal: amount,
            interest: interestRate,
            duration: duration,
            startTime: 0,
            nextPaymentDue: 0,
            remainingBalance: amount + (amount * interestRate / FEE_DENOMINATOR),
            status: LoanStatus.Requested
        });

        borrowerLoans[msg.sender].push(loanId);
        
        emit LoanRequested(loanId, msg.sender, amount, interestRate, duration);
        return loanId;
    }

    function fundLoan(uint256 loanId) external nonReentrant whenNotPaused {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Requested, "Loan not available");
        require(lenderBalances[msg.sender] >= loan.principal, "Insufficient balance");

        loan.lender = msg.sender;
        loan.status = LoanStatus.Active;
        loan.startTime = block.timestamp;
        loan.nextPaymentDue = block.timestamp + 30 days;

        lenderBalances[msg.sender] -= loan.principal;
        lenderLoans[msg.sender].push(loanId);
        borrowerActiveLoans[loan.borrower]++;

        stablecoin.safeTransfer(loan.borrower, loan.principal);
        
        emit LoanFunded(loanId, msg.sender, loan.borrower);
    }

    function makePayment(uint256 loanId, uint256 amount) external nonReentrant whenNotPaused {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active || loan.status == LoanStatus.GracePeriod, "Invalid loan status");
        require(msg.sender == loan.borrower, "Not borrower");
        require(amount > 0 && amount <= loan.remainingBalance, "Invalid amount");

        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        
        loan.remainingBalance -= amount;
        
        if (loan.remainingBalance == 0) {
            loan.status = LoanStatus.Completed;
            borrowerActiveLoans[loan.borrower]--;
            reputationOracle.updateReputation(loan.borrower, 50, true);
            
            uint256 protocolFee = loan.principal * PROTOCOL_FEE / FEE_DENOMINATOR;
            uint256 lenderAmount = (loan.principal + (loan.principal * loan.interest / FEE_DENOMINATOR)) - protocolFee;
            
            lenderBalances[loan.lender] += lenderAmount;
            
            emit LoanCompleted(loanId);
        } else {
            loan.nextPaymentDue = block.timestamp + 30 days;
            if (loan.status == LoanStatus.GracePeriod) {
                loan.status = LoanStatus.Active;
            }
        }
        
        emit PaymentMade(loanId, msg.sender, amount);
    }

    function checkAndUpdateLoanStatus(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active || loan.status == LoanStatus.GracePeriod, "Invalid status");
        
        if (block.timestamp > loan.nextPaymentDue) {
            if (loan.status == LoanStatus.Active) {
                loan.status = LoanStatus.GracePeriod;
            } else if (block.timestamp > loan.nextPaymentDue + GRACE_PERIOD) {
                loan.status = LoanStatus.Defaulted;
                borrowerActiveLoans[loan.borrower]--;
                totalDefaulted += loan.remainingBalance;
                reputationOracle.updateReputation(loan.borrower, 100, false);
                
                emit LoanDefaulted(loanId);
            }
        }
    }

    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Invalid amount");
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        lenderBalances[msg.sender] += amount;
        totalValueLocked += amount;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount <= lenderBalances[msg.sender], "Insufficient balance");
        lenderBalances[msg.sender] -= amount;
        totalValueLocked -= amount;
        stablecoin.safeTransfer(msg.sender, amount);
    }

    function getLoansByBorrower(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    function getLoansByLender(address lender) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }

    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }
}
