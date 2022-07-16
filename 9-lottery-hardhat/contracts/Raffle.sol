// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);
error Raffle__TransferFailed();
error Raffle__SendMoreToEnterRaffle();
error Raffle__RaffleNotOpen();

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    uint64 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    uint32 private immutable callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    uint256 private immutable interval;
    uint256 private lastTimeStamp;
    address private recentWinner;
    uint256 private entranceFee;
    address payable[] private players;
    RaffleState private raffleState;

    event RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player);
    event WinnerPicked(address indexed player);

    constructor(
        address _vrfCoordinatorV2,
        uint64 _subscriptionId,
        bytes32 _gasLane, // keyHash
        uint256 _interval,
        uint256 _entranceFee,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        gasLane = _gasLane;
        interval = _interval;
        subscriptionId = _subscriptionId;
        entranceFee = _entranceFee;
        raffleState = RaffleState.OPEN;
        lastTimeStamp = block.timestamp;
        callbackGasLimit = _callbackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value < entranceFee) {
            revert Raffle__SendMoreToEnterRaffle();
        }
        if (raffleState != RaffleState.OPEN) {
            revert Raffle__RaffleNotOpen();
        }
        players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True
     */
    function checkUpkeep(
        bytes memory
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory
        )
    {
        bool isOpen = RaffleState.OPEN == raffleState;
        bool timePassed = ((block.timestamp - lastTimeStamp) > interval);
        bool hasPlayers = players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0");
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(
        bytes calldata
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        // require(upkeepNeeded, "Upkeep not needed");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                players.length,
                uint256(raffleState)
            );
        }
        raffleState = RaffleState.CALCULATING;
        uint256 requestId = vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send the money to the random winner.
     */
    function fulfillRandomWords(
        uint256,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % players.length;
        address payable _recentWinner = players[indexOfWinner];
        recentWinner = _recentWinner;
        players = new address payable[](0);
        raffleState = RaffleState.OPEN;
        lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        // require(success, "Transfer failed");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /** Getters */

    function getRaffleState() public view returns (RaffleState) {
        return raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getRecentWinner() public view returns (address) {
        return recentWinner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return players[index];
    }

    function getLastTimeStamp() public view returns (uint256) {
        return lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return interval;
    }

    function getEntranceFee() public view returns (uint256) {
        return entranceFee;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return players.length;
    }
}
