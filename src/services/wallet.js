import web3, {getGasPrice} from './web3'
import uuid from 'uuid'
import BN from 'bn.js'
import co from 'co'
import ethers from 'ethers'
import config from '../config'
import {mergeNotes, searchUTXO, sendNote, shieldNote, unshieldNote} from './note'
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
  let d

  if (ts !== null) {
    d = new Date(ts * 1000)
  } else {
    d = new Date()
  }

  return {
    txId,
    direction,
    amount,
    from,
    to,
    type,
    date: d.getUTCFullYear() + '-' + d.getUTCMonth() + 1 + '-' + d.getUTCDate() + ' ' + d.getUTCHours() + ':' + d.getUTCMinutes()
  }
}

/**
 * Send amount to address
 *
 * @param {{address: string}} account
 * @param {string} toAddress
 * @param {BN} amount
 * @param {BN} gasPrice
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
 * @param {BN} tBalance
 * @param {BN} amount
 * @param tracker
 * @param tokenContract
 */
export const shield = (account, tBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    const sBalance = tokenContract.balanceOf(account.address)
    if (sBalance.lt(amount)) { throw new WalletError('Not enough balance to shield', 'NOT_ENOUGH_S_BALANCE') }

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.utils.fromWei(totalGas, 'ether'))

    if (tBalance.lt(totalGas)) { throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE') }

    yield shieldNote(tracker, amount, account.address, tokenContract)
  })
}

/**
 * Unshield amount
 *
 * @param account
 * @param {BN} tBalance
 * @param {BN} amount
 * @param tracker
 * @param tokenContract
 * @return {Promise<any>}
 */
export const unshield = (account, tBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.utils.fromWei(totalGas, 'ether'))

    // TODO: should check if it's enough gas to unshield all needed notes and shield the change afterwards
    if (tBalance.lt(totalGas)) { throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE') }

    const notes = tracker.notes.filter(n => n.address === account.address) // Get notes for address
    const totalShielded = notes.reduce((acc, n) => acc.add(n.value), new BN(0))
    if (amount.lt(totalShielded)) { throw new WalletError('Not enough shielded balance', 'NOT_ENOUGH_SHIELDED') }

    const {unspent, value} = searchUTXO(notes, amount)
    const change = value.sub(amount)
    debug('Total in unspent: ' + totalShielded + '; total filtered: ' + value + '; change: ' + change)

    // Simultaneously unshield notes (async)
    yield unspent.map(note => {
      return unshieldNote(note, tracker, account.address, tokenContract)
    })

    // Shield back change
    if (change.gt(0)) {
      yield shieldNote(tracker, change, account.address, tokenContract)
    }
  })
}

/**
 * Send shielded amount
 *
 * @param {BN} amount
 * @param recipientApk
 * @param {BN} tBalance
 * @param account
 * @param tracker
 * @param tokenContract
 */
export const sendShielded = (amount, recipientApk, tBalance, account, tracker, tokenContract) => {
  return co(function* () {
    const notes = tracker.notes.filter(n => n.address === account.address) // Get notes for address
    const shieldedBalance = notes.reduce((acc, n) => acc.add(n.value), new BN(0))

    if (shieldedBalance.lt(amount)) { throw new WalletError('Not enough shielded balance, add some funds', 'NOT_ENOUGH_SHIELDED') }

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.multipliedBy(config.unshieldGas)
    debug('Total shield cost is ' + web3.utils.fromWei(totalGas, 'ether'))
    if (tBalance.lt(totalGas)) { throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE') }

    const note = yield mergeNotes(tracker, amount, account, tokenContract)

    return yield sendNote(note, amount, recipientApk, account, tracker, tokenContract)
  })
}
