import { useEffect } from 'react'
import { useMoralis } from 'react-moralis'


export const ManualHeader = () => {

  const { Moralis, enableWeb3, deactivateWeb3, isWeb3Enabled, account, isWeb3EnableLoading } = useMoralis()

  useEffect(() => {
    if (isWeb3Enabled) {
      return
    }
    window && localStorage.getItem('connected') && enableWeb3()
  }, [isWeb3Enabled])

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      if (window && !account) {
        localStorage.removeItem('connected')
        deactivateWeb3().then()
      }
    })
  }, [])

  return account ? <div>Connected to {`${account.slice(0, 6)}...${account.slice(-4)}`}</div> : (
    <button
      disabled={isWeb3EnableLoading}
      onClick={async () => {
        await enableWeb3()
        window && localStorage.setItem('connected', 'injected')
      }}
    >
      Connect
    </button>
  )
}
