import { readFileSync, writeFileSync } from 'fs'
import { ethers, network } from 'hardhat'


const FRONTEND_ADDRESSES_FILE = '../10-lottery-frontend/constants/contractAddresses.json'
const FRONTEND_ABI_FILE = '../10-lottery-frontend/constants/abi.json'

export default async function () {
  if (process.env.UPDATE_FRONTEND) {
    console.log('Updating frontend...')
    await updateContractAddresses()
    await updateAbi()
  }
}

const updateContractAddresses = async () => {
  const raffle = await ethers.getContract('Raffle')
  const chainId = network.config.chainId!.toString()
  const currentAddresses = JSON.parse(readFileSync(FRONTEND_ADDRESSES_FILE, 'utf8'))
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(raffle.address)) {
      currentAddresses[chainId].push(raffle.address)
    }
  } else {
    currentAddresses[chainId] = [raffle.address]
  }
  writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

const updateAbi = async () => {
  const raffle = await ethers.getContract('Raffle')
  // @ts-ignore
  writeFileSync(FRONTEND_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json))
}

export const tags = ['all', 'frontend']
