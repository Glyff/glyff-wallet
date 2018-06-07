import Web3 from 'web3'
import ethers from 'ethers'
import config from '../config'

const debug = require('debug')('web3')
const web3 = new Web3()

/**
 * Connect to the node
 *
 * @return {Promise<any>}
 */
export const connect = () => {
  return new Promise((resolve, reject) => {
    if (web3.isConnected()) resolve()

    const provider = new web3.providers.HttpProvider('http://' + config.node.host + ':' + config.node.port)
    web3.setProvider(provider)

    if (web3.isConnected) {
      debug('Web3  connected!')
      resolve()
    } else {
      debug('Web3 connection error')
      reject(new Error('Web3 connection error'))
    }
  })
}

/**
 * Check if account unlocked
 *
 * @param {{id: string, address: string}} account
 */
export const isUnlocked = account => {
  debug('isUnlocked', {account})
  return new Promise((resolve, reject) => {
    // hack to check if an account is locked
    web3.eth.sign(ethers.utils.getAddress(account.address), web3.sha3('test'), function (err, result) {
      debug('isUnlocked:resolve', err + '')
      resolve(! err)
    })
  })
}

export default web3
