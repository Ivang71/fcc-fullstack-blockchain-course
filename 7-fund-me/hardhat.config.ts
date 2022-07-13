import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-waffle'
import * as dotenv from 'dotenv'
import 'hardhat-deploy'
import { HardhatUserConfig } from 'hardhat/config'

dotenv.config()

export default {
  solidity: {
    compilers: [{ version: '0.8.9' }, { version: '0.6.12' }],
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.PRIAVTE_KEY as string],
      chainId: 80001,
      blockConfirmations: 6,
    },
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: 'gas-reporter.txt',
    noColors: true,
    token: 'MATIC',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
  },
} as HardhatUserConfig
