// import { ethers } from 'hardhat'
//
// async function main() {
//   const currentTimestampInSeconds = Math.round(Date.now() / 1000)
//   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
//   const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS
//
//   const lockedAmount = ethers.utils.parseEther('1')
//
//   const Lock = await ethers.getContractFactory('Lock')
//   const lock = await Lock.deploy(unlockTime, { value: lockedAmount })
//
//   await lock.deployed()
//
//   console.log('Lock with 1 ETH deployed to:', lock.address)
// }
//
// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error)
//   process.exitCode = 1
// })

import { ethers, run, network } from 'hardhat'

const main = async () => {
  const simpleStorageFactory = await ethers.getContractFactory('SimpleStorage')
  console.log('Deploying contract...')
  const simpleStorage = await simpleStorageFactory.deploy()
  await simpleStorage.deployed()

  console.log('Contract deployed to:', simpleStorage.address)
  if (network.name === 'mumbai' && process.env.POLYGONSCAN_API_KEY) {
    console.log('Waiting to verify')
    await simpleStorage.deployTransaction.wait(6)
    await verify(simpleStorage.address, [])
  }
}

const verify = async (contractAddress: string, args: any[]) => {
  try {
    console.log('Verifying contract...')
    await run('verify:verify', {
      address: contractAddress,
      constructorArgs: args,
    })
  } catch (e: any) {
      if (e.message.toLowerCase().includes('already verified')) {
        console.log('Contract already verified')
      } else {
        console.log(e)
      }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
