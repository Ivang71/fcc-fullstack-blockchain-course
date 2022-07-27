import { BigNumber } from '@ethersproject/bignumber'
import { ContractTransaction, ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useMoralis, useMoralisSubscription, useWeb3Contract } from 'react-moralis'
import { useNotification } from 'web3uikit'
import { abi, contractAddresses } from '../constants'


export const LotteryEntrance = () => {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
  const chainId = parseInt(chainIdHex || '', 16)
  const contractAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
  const [entranceFee, setEntranceFee] = useState('0')
  const [numPlayers, setNumPlayers] = useState('0')
  const [recentWinner, setRecentWinner] = useState('0')

  useMoralisSubscription('RaffleEnter', q => q, [], {
    onCreate: data => console.log(data)
  })

  const dispatch = useNotification()

  const { runContractFunction: enterRaffle, isLoading, isFetching } = useWeb3Contract({
    abi,
    contractAddress,
    functionName: 'enterRaffle',
    params: {},
    msgValue: entranceFee
  })

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi,
    contractAddress,
    functionName: 'getEntranceFee',
    params: {}
  })

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi,
    contractAddress,
    functionName: 'getNumberOfPlayers',
    params: {}
  })

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi,
    contractAddress,
    functionName: 'getRecentWinner',
    params: {}
  })

  const handleSuccess = async (tx: ContractTransaction) => {
    await tx.wait(1)
    handleNotification()
    updateUI()
  }

  const handleNotification = () => {
    dispatch({
      type: 'info',
      message: 'Transaction complete',
      title: 'Tx notification',
      position: 'topR',
      icon: 'bell'
    })
  }

  const updateUI = () => {
    getEntranceFee().then((r) => setEntranceFee((r as BigNumber).toString()))
    getNumberOfPlayers().then((r) => setNumPlayers((r as BigNumber).toString()))
    getRecentWinner().then((r) => setRecentWinner(r as string))
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI()
    }
  }, [isWeb3Enabled])

  return contractAddress ? (
    <div className="p-5">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto transition ease-in-out duration-300"
        onClick={async () => await enterRaffle({
          onSuccess: (tx) => handleSuccess(tx as ContractTransaction),
          onError: (e) => console.error(e)
        })}
        disabled={isLoading || isFetching}
      >
        {(isLoading || isFetching)
          ? <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"/>
          : <div>Enter raffle</div>
        }
      </button>
      <p>
        Entrance fee: {ethers.utils.formatUnits(entranceFee, 'ether')} ETH
      </p>
      <p>
        Players: {numPlayers}
      </p>
      <p>
        Recent winner: {recentWinner}
      </p>
    </div>
  ) : (
    <div>
      No contract address for this chain
    </div>
  )
}
