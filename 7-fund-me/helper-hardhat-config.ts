interface NetworkConfig {
  [k: string]: {
    ethUsdPriceFeed?: string
    blockConfirmations?: number,
  }
}

export const networkConfig: NetworkConfig = {
  localhost: {},
  hardhat: {},
  mumbai: {
    ethUsdPriceFeed: '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
    blockConfirmations: 6,
  }
}

export const developmentChains = ['hardhat', 'localhost']
export const DECIMALS = 8
export const INITIAL_ANSWER = 60000000
