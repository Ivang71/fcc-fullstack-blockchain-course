// @ts-ignore
import { ethers, getNamedAccounts } from 'hardhat'


export const AMOUNT = ethers.utils.parseEther('0.02')

export const getWeth = async () => {
  const {deployer} = await getNamedAccounts()

  // weth mainnet 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

  const iWeth = await ethers.getContractAt('IWeth', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', deployer)
  const tx = await iWeth.deposit({ value: AMOUNT })
  tx.wait(1)
  const balance = await iWeth.balanceOf(deployer)
  console.log(`Got ${balance.toString()} WETH`)
}
