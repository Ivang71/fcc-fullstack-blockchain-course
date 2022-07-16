import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { Raffle } from '../../typechain-types'


developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle', () => {
    let raffle: Raffle,
      player: SignerWithAddress,
      entranceFee: BigNumber

    beforeEach(async () => {
      player = (await ethers.getSigners())[1]
      await deployments.fixture(['all'])
      raffle = (await ethers.getContract('Raffle') as Raffle).connect(player)
      entranceFee = await raffle.getEntranceFee()
    })

    describe('fulfillRandomWords', () => {
      it('works with live Chainlink Keepers and Chainlink VRF, we get a random winner', async () => {
        const startingTimestamp = await raffle.getLastTimeStamp()
        const accounts = await ethers.getSigners()

        await new Promise<void>(async (resolve, reject) => {
          raffle.once('WinnerPicked', async () => {
            console.log('WinnerPicked event fired!')
            try {
              const recentWinner = await raffle.getRecentWinner()
              const raffleState = await raffle.getRaffleState()
              const winnerBalance = await accounts[0].getBalance()
              const endingTimeStamp = await raffle.getLastTimeStamp()

              await expect(raffle.getPlayer(0)).to.be.reverted
              expect(recentWinner.toString()).to.be.equal(accounts[0].address)
              expect(raffleState).to.be.equal(0)
              expect(winnerBalance.toString()).to.be.equal(winnerSTartingBalance.add(entranceFee).toString())
              expect(endingTimeStamp).is.greaterThan(startingTimestamp)
              resolve()
            } catch (e) {
              console.error(e)
              reject(e)
            }
          })
        })

        await raffle.enterRaffle({ value: entranceFee })
        const winnerSTartingBalance = await accounts[0].getBalance()
      })
    })
  })
