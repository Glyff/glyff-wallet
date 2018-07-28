import Web3 from 'web3-zsl'
import BN from 'bn.js'
import co from 'co'
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
    // if (web3.isConnected()) resolve()

    const provider = new web3.providers.HttpProvider('http://' + config.node.host + ':' + config.node.port)
    web3.setProvider(provider)

    // Workaround to check if is connected asyncronously
    web3.currentProvider.send({id: 9999999999, jsonrpc: '2.0', method: 'net_listening', params: []}, (err, result) => {
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
    web3.eth.sign(web3.utils.sha3('test'), web3.utils.toChecksumAddress(account.address))
      .then(() => resolve(true))
      .catch(() => resolve(false))
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
  debug('unlockAccount', {address})

  return web3.eth.personal.unlockAccount(address, password, 9999)
}

/**
 * Get gas price
 *
 * @return {Promise<BN>}
 */
export const getGasPrice = () => {
  return web3.eth.getGasPrice().then(price => new BN(price))
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
  debug('[*] Generating proof for unshielding')
  const witnesses = zTracker.getWitness(commitment)
  const treeIndex = parseInt(witnesses[0])
  const authPath = witnesses[1]

  return web3.zsl.createUnshielding(note.rho, tracker.a_sk, note.value, treeIndex, authPath)
}

/**
 * Convert wei to needed unit
 *
 * @param value
 * @param unit
 */
export const fromWei = (value, unit) => {
  const glyff = '1000000000000'
  if (unit === 'GLX') {
    return new BN(value).div(new BN(glyff))
  }
  if (unit === 'GLY') unit = 'ether'

  return web3.utils.fromWei(value + '', unit)
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
  return co(function* () {
    const tmpKeypair = web3.zsl.GenerateZKeypair()
    const commitment = web3.zsl.getCommitment(note.rho, tracker.a_pk, note.value)
    const witnesses = tokenContract.getWitness(commitment)
    const treeIndex = parseInt(witnesses[0])
    const authPath = witnesses[1]

    return web3.zsl.createShieldedTransfer(
      note.rho,
      tracker.a_sk,
      note.value,
      treeIndex,
      authPath,
      yield web3.zsl.getRandomness(),
      tmpKeypair.a_sk,
      0,
      0,
      emptyUncles,
      outRho1,
      recipientApk,
      amount,
      outRho2,
      tracker.a_pk,
      change)
  })
}

export default web3
