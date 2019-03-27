import Web3 from 'web3-zsl'
import BN from 'bn.js'
import co from 'co'
import config from '../config'

const debug = require('debug')('app:web3')
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://' + config.node.host + ':' + config.node.port))

/**
 * Connect to the node
 *
 * @return {Promise<any>}
 */
export const connect = () => {
  return new Promise((resolve, reject) => {
    web3.eth.net.isListening()
      .then(() => {
        debug('Web3  connected!')
        resolve()
      })
      .catch(e => {
        debug('Web3 connection error')
        reject(e)
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

  return web3.zsl.createUnshielding(note.rho, tracker.a_sk, note.value.toNumber(), treeIndex, authPath)
}

/**
 * Convert needed unit to wei
 *
 * @param value
 * @param unit
 */
export const toWei = (value, unit) => {
  unit && (unit = unit.toUpperCase())
  if (['GLX', 'GLS'].includes(unit)) {
    unit = 'szabo'
  }
  if (unit === 'GLY') unit = 'ether'

  return new BN(web3.utils.toWei(value + '', unit))
}

/**
 * Convert wei to needed unit
 *
 * @param value
 * @param unit
 */
export const fromWei = (value, unit) => {
  unit = unit.toUpperCase()
  if (['GLX', 'GLS'].includes(unit)) {
    unit = 'szabo'
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
 * @param zaddress
 * @param outRho1
 * @param outRho2
 * @return {Promise<any>}
 */
export const createShieldedTransfer = (note, tracker, amount, change, tokenContract, zaddress, outRho1, outRho2) => {
  return co(function* () {
    const tmpKeypair = yield web3.zsl.generateZKeypair()
    const cm = yield web3.zsl.getCommitment(note.rho, tracker.a_pk, note.value.toNumber())
    const witnesses = yield tokenContract.methods.getWitness(cm).call()
    const treeIndex = parseInt(witnesses[0])
    const authPath = witnesses[1]

    // debug('createShieldedTransfer', note.rho,
    //   tracker.a_sk,
    //   note.value.toNumber(),
    //   treeIndex,
    //   authPath,
    //   yield web3.zsl.getRandomness(),
    //   tmpKeypair.a_sk,
    //   0,
    //   0,
    //   emptyUncles,
    //   outRho1,
    //   zaddress,
    //   amount.toNumber(),
    //   outRho2,
    //   tracker.a_pk,
    //   change.toNumber())

    return yield web3.zsl.createShieldedTransfer(
      note.rho,
      tracker.a_sk,
      note.value.toNumber(),
      treeIndex,
      authPath,
      yield web3.zsl.getRandomness(),
      tmpKeypair.a_sk,
      0,
      0,
      emptyUncles,
      outRho1,
      zaddress,
      amount.toNumber(),
      outRho2,
      tracker.a_pk,
      change.toNumber())
  })
}

export default web3
