import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { FundMe } from '../../typechain-types'


developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', () => {
    let fundMe: FundMe,
      deployer: SignerWithAddress,
      sendValue = ethers.utils.parseUnits('0.3', 'ether')

    beforeEach(async () => { // no need for mock and deployment, because we are testing the contract on a testnet
      deployer = (await ethers.getSigners())[0]
      fundMe = await ethers.getContract('FundMe')
    })

    it('Allows to fund and withdraw', async () => {
      await fundMe.fund({ value: sendValue })
      await fundMe.withdraw()
      const endingBalance = await ethers.provider.getBalance(fundMe.address)
      expect(endingBalance.toString()).to.be.equal("0")
    })
  })
