import web3, {getGasPrice} from './web3'
import BN from 'bn.js'
import co from 'co'
import ethers from 'ethers'
import config from '../config'
import {mergeNotes, searchUTXO, sendNote, shieldNote, unshieldNote} from './note'
import WalletError from '../errors/wallet-error'

const debug = require('debug')('app:wallet')

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
 * @param {BN} glyBalance
 * @param {BN} amount
 * @param tracker
 * @param tokenContract
 */
export const shield = (account, glyBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    debug('shield: shielding ' + amount.toString() + ' GLX')
    if (amount.isZero() || amount.lt(0)) throw new WalletError('Amount should be more than 0', 'ZERO_AMOUNT')

    const glxBalance = new BN(yield tokenContract.methods.balanceOf(account.address).call())
    debug('shield: glxBalance', glxBalance.toString())
    if (glxBalance.lt(amount)) throw new WalletError('Not enough balance to shield', 'NOT_ENOUGH_S_BALANCE')

    const gasPrice = new BN(yield getGasPrice())
    debug('shield: gasPrice', gasPrice.toString())

    const totalGas = gasPrice.mul(new BN(config.shieldGas))
    debug('Total shield cost is ' + web3.utils.fromWei(totalGas, 'ether'))

    if (glyBalance.lt(totalGas)) throw new WalletError('Insufficient funds for gas', 'NOT_ENOUGH_T_BALANCE')

    return yield shieldNote(tracker, amount, account.address, tokenContract)
  })
}

/**
 * Unshield amount
 *
 * @param account
 * @param glyBalance
 * @param {BN} amount
 * @param tracker
 * @param tokenContract
 * @return {Promise<any>}
 */
export const unshield = (account, glyBalance, amount, tracker, tokenContract) => {
  return co(function* () {
    debug('unshield: unshielding ' + amount.toString() + ' GLS')

    if (amount.isZero()) throw new WalletError('Amount should be more than 0', 'ZERO_AMOUNT')
    if (amount.gt(tracker.balance)) throw new WalletError('Not enough shielded GLS balance', 'NOT_ENOUGH_GLS')

    const totalShielded = tracker.notes.reduce((acc, n) => acc.add(n.value), new BN(0))
    const {notes, value} = searchUTXO(tracker.notes, amount)
    const change = value.sub(amount)
    const addedNotes = []
    debug('unshield: total in unspent: ' + totalShielded + '; total filtered: ' + value + '; change: ' + change, notes)

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.mul(new BN(config.unshieldGas)).mul(new BN(notes.length + (change.gt(0) ? 1 : 0)))
    debug('unshield: total unshield cost is ' + web3.utils.fromWei(totalGas, 'ether'))

    if (glyBalance.lt(totalGas)) throw new WalletError('Insufficient GLY funds for gas + price', 'NOT_ENOUGH_T_BALANCE')

    // Simultaneously unshield notes (async)
    yield notes.map(note => {
      return unshieldNote(note, tracker, account.address, tokenContract)
    })

    // Shield back change
    if (! change.isZero()) {
      debug('unshield: shielding change ' + change.toString())
      addedNotes.push(yield shieldNote(tracker, change, account.address, tokenContract))
    }

    return {removedNotes: notes, addedNotes}
  })
}

/**
 * Send shielded amount
 *
 * @param account
 * @param glyBalance
 * @param amount
 * @param zaddress
 * @param tracker
 * @param tokenContract
 * @return {*}
 */
export const sendShielded = (account, glyBalance, amount, zaddress, tracker, tokenContract) => {
  return co(function* () {
    debug('sendShielded: amount ' + amount.toString() + ' to ' + zaddress)

    const notes = tracker.notes.filter(n => n.address === account.address) // Get notes for address
    const shieldedBalance = notes.reduce((acc, n) => acc.add(n.value), new BN(0))

    if (shieldedBalance.lt(amount)) { throw new WalletError('Not enough shielded balance, add some funds', 'NOT_ENOUGH_SHIELDED') }

    const gasPrice = yield getGasPrice()
    const totalGas = gasPrice.mul(new BN(config.shieldedTransferGas))
    debug('sendShielded: total shield cost is ' + web3.utils.fromWei(totalGas, 'ether'))
    if (glyBalance.lt(totalGas)) { throw new WalletError('Insufficient funds for gas + price', 'NOT_ENOUGH_T_BALANCE') }

    // Merge notes to have exactly one note with needed amount or bigger
    const note = yield mergeNotes(tracker, amount, account, tokenContract)

    return yield sendNote(note, amount, zaddress, account, tracker, tokenContract)
  })
}
