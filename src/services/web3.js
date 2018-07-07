import Web3 from 'web3'
import ethers from 'ethers'
import BigNumber from 'bignumber.js'
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
      err ? reject(err) : resolve(result)
    })
  })
}

/**
 * Get gas price
 *
 * @return {Promise<any>}
 */
export const getGasPrice = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice((err, res) => {
      if (err) reject(err)
      resolve(new BigNumber(res))
    })
  })
}

/**
 * Create unshielding
 *
 * @param note
 * @param tracker
 * @param zTracker
 * @param commitment
 * @return {Promise<any>}
 */
export const createUnshielding = (note, tracker, zTracker, commitment) => {
  return new Promise((resolve, reject) => {
    debug('[*] Generating proof for unshielding')
    const witnesses = zTracker.getWitness(commitment)
    const treeIndex = parseInt(witnesses[0])
    const authPath = witnesses[1]

    web3.zsl.createUnshielding(note.rho, tracker.a_sk, note.value, treeIndex, authPath, (error, result) => {
      if (error) reject(error)
      debug('[*] Generating finished')
      resolve(result)
    })
  })
}

/**
 * Decrypt note
 *
 * @param sk
 * @param blob
 */
export const noteDecrypt = (sk, blob) => {
  return new Promise((resolve, reject) => {
    web3.zsl.noteDecrypt(sk, blob, (err, result) => {
      if (err) reject(err)
      resolve(result)
    })
  })
}

const emptyUncles = ['0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100']

/**
 * Create shielded transfer
 *
 * @param note
 * @param tracker
 * @param amount
 * @param change
 * @param tokenContract
 * @param recipientApk
 * @param outRho1
 * @param outRho2
 * @return {Promise<any>}
 */
export const createShieldedTransfer = (note, tracker, amount, change, tokenContract, recipientApk, outRho1, outRho2) => {
  return new Promise((resolve, reject) => {
    const tmpKeypair = web3.zsl.GenerateZKeypair()
    const commitment = web3.zsl.getCommitment(note.rho, tracker.a_pk, note.value)
    const witnesses = tokenContract.getWitness(commitment)
    const treeIndex = parseInt(witnesses[0])
    const authPath = witnesses[1]

    web3.zsl.createShieldedTransfer(
      note.rho,
      tracker.a_sk,
      note.value,
      treeIndex,
      authPath,
      web3.zsl.getRandomness(),
      tmpKeypair.a_sk,
      0,
      0,
      emptyUncles,
      outRho1,
      recipientApk,
      amount,
      outRho2,
      tracker.a_pk,
      change,
      (err, result) => {
        if (err) reject(err)

        resolve(result)
      })
  })
}

export default web3
