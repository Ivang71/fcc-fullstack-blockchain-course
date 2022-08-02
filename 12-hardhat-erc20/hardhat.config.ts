import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'dotenv/config'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'
import { HardhatUserConfig } from 'hardhat/config'
import 'solidity-coverage'


const env = process.env

const MAINNET_RPC_URL = env.MAINNET_RPC_URL || env.ALCHEMY_MAINNET_RPC_URL
const RINKEBY_RPC_URL = env.RINKEBY_RPC_URL
const KOVAN_RPC_URL = env.KOVAN_RPC_URL
const POLYGON_MAINNET_RPC_URL = env.POLYGON_MAINNET_RPC_URL
const MUMBAI_RPC_URL = env.MUMBAI_RPC_URL
const PRIVATE_KEY = env.PRIVATE_KEY
// optional
const MNEMONIC = env.MNEMONIC || 'your mnemonic'

const ETHERSCAN_API_KEY = env.ETHERSCAN_API_KEY || 'Your etherscan API key'
const POLYGONSCAN_API_KEY = env.POLYGONSCAN_API_KEY || 'Your polygonscan API key'
const REPORT_GAS = env.REPORT_GAS || false

export default {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // forking: {
      //   url: MAINNET_RPC_URL
      // }
      chainId: 31337
    },
    localhost: {
      chainId: 31337
    },
    kovan: {
      url: KOVAN_RPC_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //accounts: {
      //     mnemonic: MNEMONIC,
      // },
      saveDeployments: true,
      chainId: 42
    },
    rinkeby: {
      url: RINKEBY_RPC_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 4
    },
    mainnet: {
      url: MAINNET_RPC_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 1
    },
    polygon: {
      url: POLYGON_MAINNET_RPC_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 137
    },
    mumbai: {
      url: MUMBAI_RPC_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 80001,
    }
  },
  etherscan: {
    // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
      kovan: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: 'USD',
    token: 'MATIC',
    outputFile: 'gas-report.txt',
    noColors: true,
    coinmarketcap: env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0 // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    player: {
      default: 1
    }
  },
  solidity: {
    compilers: [
      {
        version: '0.8.8'
      },
      {
        version: '0.4.24'
      }
    ]
  },
  mocha: {
    timeout: 300000 // 300 seconds max for running tests
  }
} as HardhatUserConfig

