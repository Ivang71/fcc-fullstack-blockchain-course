import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { BigNumber } from 'ethers'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains, networkConfig } from '../../helper-hardhat-config'
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types'


!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle', () => {
    let raffle: Raffle,
      vrfCoordinatorV2Mock: VRFCoordinatorV2Mock,
      player: SignerWithAddress,
      entranceFee: BigNumber,
      interval: number,
      chainId = network.config.chainId

    beforeEach(async () => {
      player = (await ethers.getSigners())[1]
      await deployments.fixture(['all'])
      raffle = (await ethers.getContract('Raffle') as Raffle).connect(player)
      vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock')
      entranceFee = await raffle.getEntranceFee()
      interval = (await raffle.getInterval()).toNumber()
    })

    describe('constructor', () => {
      it('initializes the raffle correctly', async () => {
        const raffleState = await raffle.getRaffleState()
        const interval = await raffle.getInterval()

        expect(raffleState).to.be.equal(0)
        expect(interval).to.be.equal(networkConfig[chainId!].keepersUpdateInterval)
      })
    })

    describe('enterRaffle', () => {
      it('reverts when you don\'t pay enough', async () => {
        await expect(raffle.enterRaffle()).to.be.revertedWith('Raffle__SendMoreToEnterRaffle')
      })
      it('doesn\'t allow entrance when raffle is calculating', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.send('evm_mine', [])
        // pretend to be a Chainlink Keeper
        await raffle.performUpkeep([])
        await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith('Raffle__RaffleNotOpen')
      })
      it('records player when they enter', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        const contractPlayer = await raffle.getPlayer(0)
        expect(player.address).to.be.equal(contractPlayer)
      })
      it('emits event on enter', async () => {
        expect(await raffle.enterRaffle({ value: entranceFee })).to.emit(raffle,'RaffleEnter')
      })
    })

    describe('checkUpkeep', () => {
      it('returns false if people haven\'t send any ETH', async () => {
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.send('evm_mine', [])
        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
        expect(upkeepNeeded).to.be.false
      })
      it('returns false if raffle isn\'t open', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.send('evm_mine', [])
        await raffle.performUpkeep([])
        const raffleState = await raffle.getRaffleState()
        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
        expect(raffleState).to.be.equal(1)
        expect(upkeepNeeded).to.be.false
      })
      it('returns false if enough time hasn\'t passed', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval - 1])
        await network.provider.request({ method: 'evm_mine', params: [] })
        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x')
        expect(upkeepNeeded).to.be.false
      })
      it('returns true if enough time has passed, has players, eth, and is open', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.request({ method: 'evm_mine', params: [] })
        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x')
        expect(upkeepNeeded).to.be.true
      })
    })

    describe('performUpkeep', () => {
      it('can only run if checkUpkeep is true', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.request({ method: 'evm_mine', params: [] })
        const tx = await raffle.performUpkeep([])
        expect(tx)
      })
      it('reverts when checkUpkeep is false', async () => {
        await expect(raffle.performUpkeep([])).to.be.revertedWith('Raffle__UpkeepNotNeeded')
      })
      it('updates the raffle state, emits the event and calls vrf coordinator', async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.send('evm_mine', [])
        const txResponse = await raffle.performUpkeep([])
        const txReceipt = await txResponse.wait(1)
        const requestId = txReceipt.events![1].args!.requestId
        const raffleState = await raffle.getRaffleState()
        expect(raffleState.toString()).to.be.equal('1')
        expect(requestId.toNumber()).to.be.greaterThan(0)
      })
    })

    describe('fulfillRandomWords', () => {
      beforeEach(async () => {
        await raffle.enterRaffle({ value: entranceFee })
        await network.provider.send('evm_increaseTime', [interval + 1])
        await network.provider.send('evm_mine', [])
      })
      it('can only be called after performUpkeep', async () => {
        await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith('nonexistent request')
        await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith('nonexistent request')
      })
      it('pick the winner, resets the lottery and sends the money', async () => {
        const additionalEntrants = 3,
          startingAccountIndex = 1,
          accounts = await ethers.getSigners()

        for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
          const connectedRaffle = raffle.connect(accounts[i])
          await connectedRaffle.enterRaffle({ value: entranceFee })
        }
        const startingTimestamp = await raffle.getLastTimeStamp()

        await new Promise<void>(async (resolve, reject) => {
          raffle.once('WinnerPicked', async () => {
            try {
              const recentWinner = await raffle.getRecentWinner()
              const raffleState = await raffle.getRaffleState()
              const raffleTimeStamp = await raffle.getLastTimeStamp()
              const numPlayers = await raffle.getNumberOfPlayers()
              const winnerEndingBalance = await accounts[1].getBalance()
              expect(numPlayers.toNumber()).to.be.equal(0)
              expect(raffleState.toString()).to.be.equal('0')
              expect(raffleTimeStamp.toNumber()).to.be.greaterThan(startingTimestamp.toNumber())
              expect([
                accounts[0].address,
                accounts[1].address,
                accounts[2].address,
                accounts[3].address]).includes(recentWinner)
              expect(winnerEndingBalance).to.be.equal(
                winnerStartingBalance.add(entranceFee.mul(additionalEntrants).add(entranceFee))
              )
            } catch (e) {
              reject(e)
            }
            resolve()
          })
          const tx = await raffle.performUpkeep([])
          const txReceipt = await tx.wait(1)
          const winnerStartingBalance = await accounts[1].getBalance()
          await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events![1].args!.requestId, raffle.address)
        })
      })
    })
  })
