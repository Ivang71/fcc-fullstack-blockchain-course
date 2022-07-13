import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { FundMe, MockV3Aggregator } from '../../typechain-types'


!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', () => {
    let fundMe: FundMe,
      deployer: SignerWithAddress,
      mockV3Aggregator: MockV3Aggregator,
      sendValue = ethers.utils.parseUnits('1', 'ether')

    beforeEach(async () => {
      if (!developmentChains.includes(network.name)) {
        throw 'You need to be on a development chain to run tests'
      }
      deployer = (await ethers.getSigners())[0]
      await deployments.fixture(['all'])
      fundMe = await ethers.getContract('FundMe')
      mockV3Aggregator = await ethers.getContract('MockV3Aggregator')
    })

    describe('Constructor', () => {
      it('Sets the aggregator addresses correctly', async () => {
        const response = await fundMe.i_priceFeed()
        expect(response).to.be.equal(mockV3Aggregator.address)
      })
    })

    describe('Fund', () => {
      it('Fails if you don\'t send enough ETH', async () => {
        await expect(fundMe.fund()).to.be.rejectedWith('You need to spend more ETH!')
      })
      it('Updates the amount funded data structure', async () => {
        await fundMe.fund({ value: sendValue })
        const response = await fundMe.addressToAmountFunded(deployer.address)
        expect(response).to.be.equal(sendValue)
      })
      it('Adds funder to array of funders', async () => {
        await fundMe.fund({ value: sendValue })
        const funder = await fundMe.funders(0)
        expect(funder).to.be.equal(deployer.address)
      })
    })

    describe('Receive', async () => {
      it('Calls fund function', async () => {
        await deployer.sendTransaction({ to: fundMe.address, value: sendValue })
        const funder = await fundMe.funders(0)
        expect(funder).to.be.equal(deployer.address)
      })
    })

    describe('Fallback', async () => {
      it('Calls fund function', async () => {
        await deployer.sendTransaction({ to: fundMe.address, value: sendValue, data: '0x0000' })
        const funder = await fundMe.funders(0)
        expect(funder).to.be.equal(deployer.address)
      })
    })

    describe('Withdraw', async () => {
      beforeEach(async () => {
        await fundMe.fund({ value: sendValue })
      })

      it('Withdraw eth from a single founder ', async () => {
        const startingFundMeBalance = await ethers.provider.getBalance(fundMe.address),
          startingDeployerBalance = await ethers.provider.getBalance(deployer.address)

        const txResponse = await fundMe.withdraw()
        const { gasUsed, effectiveGasPrice } = await txResponse.wait(1)
        const gasCost = gasUsed.mul(effectiveGasPrice)

        const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address),
          endingDeployerBalance = await ethers.provider.getBalance(deployer.address)

        expect(endingFundMeBalance).to.be.equal(0)
        expect(endingDeployerBalance.add(gasCost)).to.be.equal(startingDeployerBalance.add(startingFundMeBalance))
      })
      it('Withdraw eth from multiple founders ', async () => {
        const accounts = await ethers.getSigners()
        for (let i = 0; i < accounts.length; i++) {
          await fundMe.connect(accounts[i]).fund({ value: sendValue })
        }

        const startingFundMeBalance = await ethers.provider.getBalance(fundMe.address),
          startingDeployerBalance = await ethers.provider.getBalance(deployer.address)

        const txResponse = await fundMe.withdraw()
        const { gasUsed, effectiveGasPrice } = await txResponse.wait(1)
        const gasCost = gasUsed.mul(effectiveGasPrice)

        const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address),
          endingDeployerBalance = await ethers.provider.getBalance(deployer.address)

        expect(endingFundMeBalance).to.be.equal(0)
        expect(endingDeployerBalance.add(gasCost)).to.be.equal(startingDeployerBalance.add(startingFundMeBalance))

        await expect(fundMe.funders(0)).to.be.rejected

        for (let i = 0; i < accounts.length; i++) {
          expect(await fundMe.addressToAmountFunded(accounts[i].address)).to.be.equal(0)
        }
      })
      it('Only allows the owner to withdraw', async () => {
        const attacker = (await ethers.getSigners())[1]
        await expect(fundMe.connect(attacker).withdraw()).to.be.rejectedWith('FundMe__NotOwner')
      })
    })
  })
