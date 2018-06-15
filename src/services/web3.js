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

    // Workaround to check if is connected asyncronously
    web3.currentProvider.sendAsync({id: 9999999999, jsonrpc: '2.0', method: 'net_listening', params: []}, (err, result) => {
      if (err) {
        debug('Web3 connection error')
        return reject(err)
      }

      debug('Web3  connected!')
      resolve(result)
    })
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

/**
 * Unlock account
 *
 * @param {string} address
 * @param {string} password
 * @return {Promise<any>}
 */
export const unlockAccount = (address, password) => {
  debug('unlock', {address})
  return new Promise((resolve, reject) => {
    web3.personal.unlockAccount(address, password, 9999, function (err, result) {
      debug('unlock:resolve', err + '')
      err ? reject(err) : resolve()
    })
  })
}

export default web3
