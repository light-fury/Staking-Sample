//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8;

import "hardhat/console.sol";
import "./IERC20.sol";
import "./ReentrancyGuard.sol";
import "./Ownable.sol";

contract TNKStaking is Ownable, ReentrancyGuard {
    IERC20 public tnkToken;

    address public distributor;
    uint public totalSupply;
    uint public currentReward;
    uint public rewardPrecision;
    mapping(address => uint) private lockedBalances;
    mapping(address => uint) private balances;
    mapping(address => uint) private initialReward;

    constructor(address _stakingToken, address _distributor) {
        tnkToken = IERC20(_stakingToken);
        distributor = _distributor;
        rewardPrecision = 10 ** 18;
    }

    function setDistributor(address _distributor) external onlyOwner {
        distributor = _distributor;
    }

    function stakeTNK(uint _amount) external {
        tnkToken.transferFrom(_msgSender(), address(this), _amount);
        if (balances[_msgSender()] > 0) {
            lockedBalances[_msgSender()] += balances[_msgSender()]
                + balances[_msgSender()] * (currentReward - initialReward[_msgSender()]) / rewardPrecision;
            totalSupply -= balances[_msgSender()];
        }
        initialReward[_msgSender()] = currentReward;
        balances[_msgSender()] = _amount;
        totalSupply += _amount;
    }

    function distributeReward(uint _reward) external {
        require(_msgSender() == distributor, "Distributor not authorized");
        require(totalSupply > 0, "No available stakers");
        tnkToken.transferFrom(_msgSender(), address(this), _reward);
        currentReward = currentReward + _reward * rewardPrecision / totalSupply;
    }

    function unstakeTNK(uint _amount) external nonReentrant {
        uint totalDeposited = balances[_msgSender()];
        require(totalDeposited >= _amount, "Not enough TNK token to unstake");
        uint reward = _amount * (currentReward - initialReward[_msgSender()]) / rewardPrecision;
        totalSupply -= _amount;
        balances[_msgSender()] = totalDeposited - _amount;
        tnkToken.transfer(_msgSender(), reward + _amount);
    }

    function releasableReward() external view returns (uint) {
        return balances[_msgSender()] * (currentReward - initialReward[_msgSender()]) / rewardPrecision;
    }

    function unstakeableTNK() external view returns (uint) {
        return balances[_msgSender()];
    }

    function lockedTNK() external view returns (uint) {
        return lockedBalances[_msgSender()];
    }

    function releaseLockedTNK() external nonReentrant {
        uint lockedBalance = lockedBalances[_msgSender()];
        require(lockedBalance > 0, "Not enough TNK token to withdraw");
        lockedBalances[_msgSender()] = 0;
        tnkToken.transfer(_msgSender(), lockedBalance);
    }
}
