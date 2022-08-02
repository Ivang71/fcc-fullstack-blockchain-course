import { BigNumber } from 'ethers'
// @ts-ignore
import { ethers, getNamedAccounts } from 'hardhat'
import { AggregatorV3Interface, IERC20, ILendingPool, ILendingPoolAddressesProvider } from '../typechain-types'
import { AMOUNT, getWeth } from './getWeth'


const main = async () => {
  await getWeth()

  const { deployer } = await getNamedAccounts()

  const lendingPool = await getLendingPool(deployer)
  const wethTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  await approve(wethTokenAddress, lendingPool.address, AMOUNT, deployer)

  console.log('Depositing...')
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
  console.log('Deposited')

  let [availableBorrowsETH, totalDebtETH] = await getBorrowUserData(lendingPool, deployer)

  const daiPrice = await getDaiPrice()
  const amountDaiToBorrow = availableBorrowsETH.div(daiPrice)
  console.log(`You can borrow ${amountDaiToBorrow} DAI`)
  const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())

  const daiTokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer)
  await getBorrowUserData(lendingPool, deployer)

  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)

  await getBorrowUserData(lendingPool, deployer)
}

const repay = async (amount: BigNumber, daiAddress: string, lendingPool: ILendingPool, account: string) => {
  await approve(daiAddress, lendingPool.address, amount, account)
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
  await repayTx.wait(1)
  console.log('Repaid')
}

const borrowDai = async (daiAddress: string, lendingPool: ILendingPool, amountDaiToBorrowWei: BigNumber, account: string) => {
  const tx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account)
  await tx.wait(1)
  console.log('You have borrowed')
}

const getDaiPrice = async () => {
  const daiEthPriceFeed = await ethers.getContractAt<AggregatorV3Interface>('AggregatorV3Interface', '0x773616E4d11A78F511299002da57A0a94577F1f4')
  const price = (await daiEthPriceFeed.latestRoundData())[1]
  console.log(`The current DAI price is ${price} ETH`)
  return price
}

const getBorrowUserData = async (lendingPool: ILendingPool, account: string): Promise<[BigNumber, BigNumber]> => {
  const {
    totalCollateralETH,
    totalDebtETH,
    availableBorrowsETH
  } = await lendingPool.getUserAccountData(account)
  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
  return [availableBorrowsETH, totalDebtETH ]
}

const getLendingPool = async (account: string): Promise<ILendingPool> => {
  const lendingPoolAddressesProvider: ILendingPoolAddressesProvider = await ethers.getContractAt(
    'ILendingPoolAddressesProvider',
    '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5',
    account
  )
  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
  return await ethers.getContractAt<ILendingPool>('ILendingPool', lendingPoolAddress, account)
}

const approve = async (erc20Address: string, spender: string, amount: BigNumber, account: string) => {
  const erc20Token = await ethers.getContractAt<IERC20>('IERC20', erc20Address, account)
  const tx = await erc20Token.approve(spender, amount)
  await tx.wait(1)
  console.log('Approved')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
