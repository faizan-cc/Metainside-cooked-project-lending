// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationOracleByMetaInside is Ownable {
    struct ReputationScore {
        uint256 score;
        uint256 totalLoans;
        uint256 successfulLoans;
        uint256 defaultedLoans;
        uint256 lastUpdate;
    }

    mapping(address => ReputationScore) public reputations;
    
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant MIN_SCORE = 0;
    uint256 public constant INITIAL_SCORE = 500;
    
    event ReputationUpdated(address indexed user, uint256 newScore, bool positive);

    constructor() Ownable(msg.sender) {}

    function initializeReputation(address user) external {
        if (reputations[user].lastUpdate == 0) {
            reputations[user] = ReputationScore({
                score: INITIAL_SCORE,
                totalLoans: 0,
                successfulLoans: 0,
                defaultedLoans: 0,
                lastUpdate: block.timestamp
            });
        }
    }

    function updateReputation(address user, uint256 change, bool positive) external onlyOwner {
        ReputationScore storage rep = reputations[user];
        
        if (rep.lastUpdate == 0) {
            rep.score = INITIAL_SCORE;
        }
        
        if (positive) {
            rep.score = rep.score + change > MAX_SCORE ? MAX_SCORE : rep.score + change;
            rep.successfulLoans++;
        } else {
            rep.score = rep.score > change ? rep.score - change : MIN_SCORE;
            rep.defaultedLoans++;
        }
        
        rep.totalLoans++;
        rep.lastUpdate = block.timestamp;
        
        emit ReputationUpdated(user, rep.score, positive);
    }

    function getReputation(address user) external view returns (uint256) {
        if (reputations[user].lastUpdate == 0) {
            return INITIAL_SCORE;
        }
        return reputations[user].score;
    }

    function getFullReputation(address user) external view returns (ReputationScore memory) {
        if (reputations[user].lastUpdate == 0) {
            return ReputationScore({
                score: INITIAL_SCORE,
                totalLoans: 0,
                successfulLoans: 0,
                defaultedLoans: 0,
                lastUpdate: block.timestamp
            });
        }
        return reputations[user];
    }
}
