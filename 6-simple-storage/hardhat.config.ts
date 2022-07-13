import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-waffle'
import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import './tasks/block-number'

dotenv.config()

export default {
  solidity: '0.8.9',
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.PRIAVTE_KEY as string],
      chainId: 80001
    },
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
  gasReporter: {
    enabled: false,
    outputFile: 'gas-reporter.txt',
    noColors: true,
    token: 'MATIC',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
} as HardhatUserConfig
