import web3, {getGasPrice} from './web3'
import uuid from 'uuid'
import BigNumber from 'bignumber.js'
import co from 'co'
import ethers from 'ethers'
import config from '../config'
import {mergeNotes, searchUTXO, shieldNote, unshieldNote} from './note'
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
 * Shield amount
 *
 * @param account
 * @param {BigNumber} tBalance
 * @param {BigNumber} amount
 * @param tracker
 * @param tokenContract
 */
export const shield = (account, tBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    const sBalance = tokenContract.balanceOf(account.address)
    if (sBalance.isLessThan(amount))
      throw new WalletError('Not enough balance to shield', 'NOT_ENOUGH_S_BALANCE')

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))

    if (tBalance.isLessThan(totalGas))
      throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE')

    yield shieldNote(tracker, amount, account.address, tokenContract)
  })
}

/**
 * Unshield amount
 *
 * @param account
 * @param {BigNumber} tBalance
 * @param {BigNumber} amount
 * @param tracker
 * @param tokenContract
 * @return {Promise<any>}
 */
export const unshield = (account, tBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))

    // TODO: should check if it's enough gas to unshield all needed notes and shield the change afterwards
    if (tBalance.isLessThan(totalGas))
      throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE')

    const notes = tracker.notes.filter(n => n.address === account.address) // Get notes for address
    const totalShielded = notes.reduce((acc, n) => acc.plus(n.value), new BigNumber(0))
    if (amount.isLessThan(totalShielded))
      throw new WalletError('Not enough shielded balance', 'NOT_ENOUGH_SHIELDED')

    const {unspent, value} = searchUTXO(notes, amount)
    const change = value.minus(amount)
    debug('Total in unspent: ' + totalShielded + '; total filtered: ' + value + '; change: ' + change)

    // Simultaneously unshield notes (async)
    yield unspent.map(note => {
      return unshieldNote(note, tracker, account.address, tokenContract)
    })

    // Shield back change
    if (change.isGreaterThan(0)) {
      yield shieldNote(tracker, change, account.address, tokenContract)
    }
  })
}

/**
 * Send shielded amount
 *
 * @param account
 * @param {BigNumber} tBalance
 * @param {BigNumber} amount
 * @param recipientApk
 * @param tracker
 */
export const sendShielded = (account, tBalance, amount, recipientApk, tracker, tokenContract) => {
  return co(function* () {
    const notes = tracker.notes.filter(n => n.address === account.address) // Get notes for address
    const shieldedBalance = notes.reduce((acc, n) => acc.plus(n.value), new BigNumber(0))

    if (shieldedBalance.isLessThan(amount))
      throw new WalletError('Not enough shielded balance, add some funds', 'NOT_ENOUGH_SHIELDED')

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))
    if (tBalance.isLessThan(totalGas))
      throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE')

    const note = yield mergeNotes(tracker, amount, account, tokenContract)

    // TODO: sendNoteTx()
  })
}
