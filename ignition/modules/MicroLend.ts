import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseUnits } from "viem";

export default buildModule("MicroLendModule", (m) => {
  // Deploy mock USDC for testing
  const usdc = m.contract("MockERC20", ["USD Coin", "USDC", 6, parseUnits("1000000", 6)], {
    id: "USDC"
  });

  // Deploy reputation oracle - serialize after USDC
  const reputationOracle = m.contract("ReputationOracleByMetaInside", [], {
    id: "REPUTATION_ORACLE",
    after: [usdc]
  });

  // Deploy lending pool - serialize after reputation oracle
  const lendingPool = m.contract("LendingPoolByMetaInside", [usdc, reputationOracle], {
    id: "LENDING_POOL",
    after: [reputationOracle]
  });

  // Transfer ownership of reputation oracle to lending pool - serialize after lending pool
  const transferOwnership = m.call(reputationOracle, "transferOwnership", [lendingPool], {
    id: "TRANSFER_ORACLE_OWNERSHIP",
    after: [lendingPool]
  });

  // Mint some USDC to deployer for testing - serialize after ownership transfer
  const mintUsdc = m.call(usdc, "mint", [m.getAccount(0), parseUnits("10000", 6)], {
    id: "MINT_TEST_USDC",
    after: [transferOwnership]
  });

  return { usdc, reputationOracle, lendingPool };
});
