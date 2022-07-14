const connectedText = document.getElementById('connectedText')
const connectButton = document.getElementById('connectButton')
const withdrawButton = document.getElementById('withdrawButton')
const fundButton = document.getElementById('fundButton')
const balanceButton = document.getElementById('balanceButton')
connectButton.onclick = connect
withdrawButton.onclick = withdraw
fundButton.onclick = fund
balanceButton.onclick = getBalance

import { ethers } from './ethers-5.6.esm.min.js'
import { fundMeAbi, fundMeAddress } from './constants.js'


async function connect() {
  if (typeof ethereum !== 'undefined') {
    try {
      await ethereum.request({ method: 'eth_requestAccounts' })
      connectedText.innerHTML = 'Connected'
      connectButton.remove()
    } catch (error) {
      console.log(error)
    }
    const accounts = await ethereum.request({ method: 'eth_accounts' })
    console.log(accounts)
  } else {
    connectedText.innerHTML = 'Please install MetaMask'
  }
}

async function getBalance() {
  if (typeof ethereum !== 'undefined') {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const balance = await provider.getBalance(fundMeAddress)
    console.log(ethers.utils.formatEther(balance))
  }
}

async function fund() {
  const ethAmount = document.querySelector('#ethAmount').value
  console.log('Funding with ', ethAmount)
  if (typeof ethereum !== 'undefined') {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(fundMeAddress, fundMeAbi, signer)
    try {
      const txResponse = await contract.fund({ value: ethers.utils.parseUnits(ethAmount, 'ether') })
      await listenForTxMine(txResponse, provider)
      console.log('Done')
      document.querySelector('#ethAmount').value = ''
    } catch (e) {
      console.log(e)
    }
  }
}

function listenForTxMine(txResponse, provider) {
  console.log(`Mining ${txResponse.hash}...`)
  return new Promise((resolve, reject) => {
    provider.once(txResponse.hash, (txReceipt) => {
      console.log(`Completed with ${txReceipt.confirmations} confirmations`)
      resolve()
    })
  })
}

async function withdraw() {
  if (typeof ethereum !== 'undefined') {
    console.log('Withdrawing...')
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(fundMeAddress, fundMeAbi, signer)
    try {
      const txResponse = await contract.withdraw()
      await listenForTxMine(txResponse, provider)
    } catch (e) {
      console.log(e)
    }
  }
}

