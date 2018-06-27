import web3, {getGasPrice} from './web3'
import uuid from 'uuid'
import BigNumber from 'bignumber.js'
import co from 'co'
import ethers from 'ethers'
import config from '../config'
import {shieldNote} from './note'
import WalletError from '../errors/wallet-error'

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
 * @param {BigNumber} tBalance
 * @param {BigNumber} amount
 * @param tracker
 * @param tokenContract
 */
export const shield = (account, tBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    const balance = tokenContract.balanceOf(account.address)
    if (balance.isLessThan(amount)) {
      throw new WalletError('Not enough balance to shield', 'NOT_ENOUGH_S_BALANCE')
    }

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))

    if (tBalance.isLessThan(totalGas)) {
      throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE')
    }

    yield shieldNote(tracker, amount, account.address, tokenContract)
  })
}

/**
 * Unshield
 *
 * @param account
 * @param {BigNumber} tBalance
 * @param {BigNumber} amount
 * @param tracker
 * @return {Promise<any>}
 */
export const unshield = (account, tBalance, amount, tracker) => {
  return co(function* () {
    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))

    if (tBalance.isLessThan(totalGas)) {
      throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE')
    }

    // TODO not finished
  })
}
