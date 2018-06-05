import Web3 from 'web3'
import config from '../config'

const web3 = new Web3()

export const connect = () => {
  return new Promise((resolve, reject) => {
    if (web3.isConnected()) resolve()

    const provider = new web3.providers.HttpProvider('http://' + config.node.host + ':' + config.node.port)
    web3.setProvider(provider)

    if (web3.isConnected) {
      console.log('Web3  connected!')
      resolve()
    } else {
      console.log('Web3 connection error')
      reject(new Error('Web3 connection error'))
    }
  })
}

export default web3
