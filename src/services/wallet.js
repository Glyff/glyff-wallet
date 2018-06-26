import web3 from './web3'
import uuid from 'uuid'
import BigNumber from 'bignumber.js'
import ethers from 'ethers'
import config from '../config'
import store from '../renderer/store'
import {shieldNote} from './note'

const debug = require('debug')('wallet')

/**
 * Create a new wallet
 *
 * @param password
 * @param oToken
 * @return {{tokenContract, account, tracker}}
 */
export const createWallet = ({password, oToken}) => {
  const account = {
    address: web3.personal.newAccount(password),
    balance: 0,
    id: 0,
    unlocked: false,
  }

  const tokenContract = web3.eth.contract(oToken.abi).at(oToken.address)

  const tracker = Object.assign({}, web3.zsl.GenerateZKeypair(), {
    id: 0,
    uuid: uuid.v4(),
    balance: 0,
    notes: [],
    spent: [],
    lastBlock: web3.eth.blockNumber,
  })

  return {tokenContract, account, tracker}
}

/**
 * Make new address
 *
 * @param password
 * @return {*}
 */
export const getNewAddress = (password) => {
  return {
    address: web3.personal.newAccount(password),
    balance: 0,
    id: 0,
    unlocked: false,
  }
}

/**
 * Create tracker
 *
 * @return {*}
 */
export const createTracker = () => {
  return Object.assign({}, web3.zsl.GenerateZKeypair(), {
    id: 0,
    uuid: uuid.v4(),
    balance: 0,
    notes: [],
    spent: [],
    lastBlock: web3.eth.blockNumber,
  })
}

/**
 * Make transaction (TODO move to blockhacin service)
 *
 * @param txId
 * @param direction
 * @param amount
 * @param from
 * @param to
 * @param type
 * @param ts
 */
export const makeTx = (txId, direction, amount, from, to, type, ts = null) => {
  const o = {}

  if (ts !== null) {
    const d = new Date(ts * 1000)
  } else {
    const d = new Date()
  }

  o.txId = txId
  o.direction = direction
  o.amount = amount
  o.from = from
  o.to = to
  o.type = type
  o.date =
    d.getUTCFullYear() + '-' +
    d.getUTCMonth() + 1 + '-' +
    d.getUTCDate() + ' ' +
    d.getUTCHours() + ':' +
    d.getUTCMinutes()

  return o
}

/**
 * Send amount to address
 *
 * @param {{address: string}} account
 * @param {string} toAddress
 * @param {BigNumber} amount
 * @param {BigNumber} gasPrice
 * @return {Promise<any>}
 */
export const sendAmount = (account, toAddress, amount, gasPrice) => {
  return new Promise((resolve, reject) => {
    web3.eth.sendTransaction({
      from: ethers.utils.getAddress(account.address),
      to: ethers.utils.getAddress(toAddress),
      value: web3.toWei(amount),
      gasPrice: gasPrice,
      gasLimit: 21000
    }, (err, result) => {
      err ? reject(err) : resolve(result)
    })
  })
}

/**
 * Shield
 *
 * @param account
 * @param {BigNumber} amount
 * @param tracker
 * @param zToken
 */
export const shield = (account, amount, tracker, zToken) => {
  return new Promise((resolve, reject) => {
    if (account.locked) {
      return reject(new Error('Selected account is locked'))
    }

    const balance = zToken.balanceOf(account.address)

    if (balance.isLessThan(amount)) {
      return reject(new Error('Not enough balance to shield'))
    }

    web3.eth.getGasPrice(function (err, res) {
      if (err) return reject(new Error('Error estimating gas costs:' + err))

      const totalGas = new BigNumber(config.unshieldGas * res)
      debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))

      if (store.getters('general/tBalance').isLessThan(totalGas)) {
        return reject(new Error('Insufficient funds for gas + price'))
      }

      shieldNote(tracker, amount, account.address, zToken)
        .then(() => resolve())
        .catch(err => reject(err))
    })
  })
}

/**
 * Unshield
 *
 * @param account
 * @param {BigNumber} amount
 * @param tracker
 * @return {Promise<any>}
 */
export const unshield = (account, amount, tracker) => {
  return new Promise((resolve, reject) => {
    if (account.locked) {
      return reject(new Error('Selected account is locked'))
    }

    web3.eth.getGasPrice(function (err, res) {
      if (err) return reject(new Error('Error estimating gas costs:' + err))

      const totalGas = new BigNumber(config.unshieldGas * res)
      debug('Total unshield cost is ' + web3.fromWei(totalGas, 'ether'))

      if (store.getters('general/tBalance').isLessThan(totalGas)) {
        return reject(new Error('Insufficient funds for gas + price'))
      }

      // TODO not finished
    })
  })
}
