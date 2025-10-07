import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";
import { parseUnits } from "viem";
import { network } from "hardhat";

describe("LendingPool", () => {
  let lendingPool: any;
  let usdc: any;
  let reputationOracle: any;
  let owner: any;
  let lender: any;
  let borrower: any;
  
  beforeEach(async () => {
    const { viem } = await network.connect();
    const [_owner, _lender, _borrower] = await viem.getWalletClients();
    owner = _owner;
    lender = _lender;
    borrower = _borrower;

    // Deploy contracts
    usdc = await viem.deployContract("MockERC20", ["USDC", "USDC", 6, parseUnits("1000000", 6)]);
    reputationOracle = await viem.deployContract("ReputationOracleByMetaInside");
    lendingPool = await viem.deployContract("LendingPoolByMetaInside", [usdc.address, reputationOracle.address]);
    
    // Transfer ownership
    await reputationOracle.write.transferOwnership([lendingPool.address]);
    
    // Initialize borrower reputation
    await lendingPool.write.initializeReputation([borrower.account.address], { account: owner.account });
    
    // Fund lender
    await usdc.write.mint([lender.account.address, parseUnits("10000", 6)]);
  });

  it("Should allow lender to deposit funds", async () => {
    const amount = parseUnits("1000", 6);
    
    await usdc.write.approve([lendingPool.address, amount], { account: lender.account });
    await lendingPool.write.deposit([amount], { account: lender.account });
    
    const balance = await lendingPool.read.lenderBalances([lender.account.address]);
    expect(balance).to.equal(amount);
  });

  it("Should allow borrower to request loan", async () => {
    const amount = parseUnits("500", 6);
    const interestRate = 1200n; // 12%
    const duration = 30n * 24n * 60n * 60n; // 30 days
    
    const tx = await lendingPool.write.requestLoan([amount, interestRate, duration], { account: borrower.account });
    
    const events = await lendingPool.getEvents.LoanRequested();
    expect(events.length).to.be.greaterThan(0);
  });
});
