import web3, {createShieldedTransfer, createUnshielding, getGasPrice, noteDecrypt} from './web3'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import co from 'co'
import config from '../config'
import NoteError from '../errors/note-error'
import BalanceError from '../errors/balance-error'
import {makeTx} from './wallet'

const debug = require('debug')('note')

/**
 * Merge notes
 *
 * @param {{}} tracker
 * @param {BigNumber} amount
 * @param account
 * @param tokenContract
 */
export const mergeNotes = (tracker, amount, account, tokenContract) => {
  const notes = tracker.notes.find(n => n.account === account.address) // Filter account notes
  const {unspent, value} = searchUTXO(notes, amount)

  const change = value.minus(amount)
  debug('Total filtered : ' + value + ' + change : ' + change)

  if (unspent.length > config.maxUnshieldings)
    throw new NoteError('Maximum unshieldings has been reached', 'MAX_UNSHIELDINGS')

  debug('Unspend notes: ' + JSON.stringify(unspent))

  return co(function* () {
    // Simultaneously unshield all notes (async)
    yield unspent.map(note => {
      return unshieldNote(note, tracker, account.address, tokenContract)
    })

    return yield shieldNote(tracker, amount, account.address, tokenContract)
  })
}

/**
 * Unshield single note
 *
 * @param note
 * @param tracker
 * @param address
 * @param tokenContract
 * @return {Promise<any>}
 */
export const unshieldNote = (note, tracker, address, tokenContract) => {
  return new Promise((resolve, reject) => {
    const commitment = web3.zsl.getCommitment(note.rho, tracker.a_pk, note.value)
    createUnshielding(note, tracker, tokenContract, commitment).then(unshielding => {
      const root = tokenContract.root()

      tokenContract.unshield(unshielding.proof, unshielding.spend_nf, commitment, root, note.value, {
        from: address,
        gas: config.unshieldGas
      }, function (error, result) {
        error ? reject(error) : resolve(result)
      })
    })
  })
}

/**
 * Shield a note
 *
 * @param tracker
 * @param value
 * @param address
 * @param ztoken
 * @return {Promise<any>}
 */
export const shieldNote = (tracker, value, address, ztoken) => {
  return new Promise((resolve, reject) => {
    const rho = web3.zsl.getRandomness()

    debug('Generating proof for shielding - value : ' + value)
    // TODO is this sync method? is there async alternative?
    const result = web3.zsl.createShielding(rho, tracker.a_pk, value)
    debug('Generating finished')

    const note = {
      rho,
      value,
      uuid: web3.toHex(web3.sha3(result.cm, {encoding: 'hex'})),
      ztoken: ztoken.address,
      confirmed: false,
      address,
      tracker: tracker.uuid,
    }

    ztoken.shield(result.proof, result.send_nf, result.cm, value, {from: address, gas: 200000}, (error, result) => {
      error ? reject(error) : resolve(note)
    })
  })
}

/**
 * Reset notes
 *
 * @param tracker
 * @param account
 * @param tBalance
 * @param tokenContract
 */
export const unshieldAllNotes = (tracker, account, tBalance, tokenContract) => {
  return new Promise((resolve, reject) => {
    getGasPrice().then(gasPrice => {
      if (tBalance.isLessThan(gasPrice.multipliedBy(tracker.notes.length))) {
        reject(new BalanceError('Not enough balance to unshield all notes'))
      }

      co(function* () {
        // Simultaneously unshield all notes (async)
        yield tracker.notes.map(note => {
          return unshieldNote(note, tracker, account.address, tokenContract)
        })

        resolve()
      }).catch(err => reject(err))
    })
  })
}

/**
 * Consolidate note
 *
 * @param tracker
 * @param note
 * @param transactionHash
 * @param blockNumber
 * @return {{}}
 */
export const consolidateNote = (tracker, note, transactionHash, blockNumber) => {
  return makeTx(transactionHash, 'inbound', note.value, note.tracker, tracker.zaddr, 'S', web3.eth.getBlock(blockNumber).timestamp)
}

/**
 * Create note
 *
 * @param tracker
 * @param rho
 * @param {BigNumber} value
 * @param address
 * @param tokenContract
 */
export const createNote = (tracker, rho, value, address, tokenContract) => {
  const pk = tracker.a_pk
  const cm = web3.zsl.getCommitment(rho, pk, value)

  return {
    rho,
    value,
    uuid: web3.toHex(web3.sha3(cm, {encoding: 'hex'})),
    address,
    confirmed: true,
    ztoken: tokenContract.address,
    tracker: tracker.uuid,
  }
}

/**
 * Search unspent transactions outputs
 *
 * @param {array} notes
 * @param {BigNumber} amount
 * @return {{utxos: Array, value: BigNumber}}
 */
export const searchUTXO = (notes, amount) => {
  // Find exact match
  const exactMatch = notes.find(n => n.value.isEqualTo(amount))
  if (exactMatch) {
    debug('Found exact note match')
    return {
      unspent: [exactMatch],
      value: exactMatch.value,
    }
  }

  // To find smallest matching value
  const sortedNotes = notes.slice().sort((a, b) => a.value.minus(b.value))

  // Find bigger match
  const biggerMatch = sortedNotes.find(n => n.value.isGreaterThan(amount))
  if (biggerMatch) {
    debug('Found bigger note match')
    return {
      unspent: [biggerMatch],
      value: biggerMatch.value,
    }
  }

  // Find multiple until total is more or exact match
  const foundNotes = []
  let total = new BigNumber(0)
  sortedNotes.forEach(n => {
    if (total.isLessThan(amount)) {
      foundNotes.push(n)
      total = total.plus(n.value)
    }
  })

  const totalFound = foundNotes.reduce((acc, n) => acc.plus(n.value), new BigNumber(0))
  if (totalFound.isLessThan(amount)) {
    throw new NoteError('Could not find enough unspent notes', 'NO_UNSPENT_FOUND')
  }

  return {
    unspent: foundNotes,
    value: totalFound,
  }
}

/**
 * Decrypt blob
 *
 * @param tracker
 * @param blob
 * @param address
 * @param tokenContract
 * @return {*}
 */
export const decryptBlob = (tracker, blob, address, tokenContract) => {
  return co(function* () {
    const decrypted = yield noteDecrypt(tracker.a_sk, blob)

    return createNote(tracker, decrypted.out_rho_1, new BigNumber(decrypted.value), address, tokenContract)
  })
}

/**
 * Send shielded note to an address
 */
export const sendNote = (note, amount, recipientApk, account, tracker, tokenContract) => {
  return new Promise((resolve, reject) => {
    debug('Started sendNote')
    if (note.value.isLessThan(amount)) {
      return reject(new NoteError('Cannot transfer ' + amount + ' as note value of ' + note.value + ' is too small.', 'NOT_ENOUGH_NOTE_VALUE'))
    }

    const change = note.value.minus(amount)
    const outRho1 = web3.zsl.getRandomness()
    const outRho2 = web3.zsl.getRandomness()

    createShieldedTransfer(note, tracker, amount, change, tokenContract, recipientApk, outRho1, outRho2)
      .then(result => {

        debug('Finishd sendNote' + JSON.stringify(result))

        const n1 = {
          value: amount,
          rho: outRho1,
          uuid: web3.toHex(web3.sha3(result.out_cm_1, {encoding: 'hex'})),
          ztoken: tokenContract.address,
          confirmed: false,
          address: null,
          tracker: null,
        }

        debug('Recipient receives note of ' + amount + ' ' + tokenContract.name())

        let n2 = {}
        if (change.isGreaterThan(0)) {
          n2 = {
            value: change,
            rho: outRho2,
            uuid: web3.toHex(web3.sha3(result.out_cm_2, {encoding: 'hex'})),
            ztoken: tokenContract.address,
            confirmed: false,
            address: account.address(),
            tracker: tracker.uuid,
          }
        }

        debug('Sender receives change of ' + change + ' ' + tokenContract.name())
        debug('Submit shielded transfer to z-contract...')

        const o = {
          n: note,
          n1: n1,
          n2: n2,
          to: recipientApk,
        }

        tokenContract.shieldedTransfer(
          result.proof,
          tokenContract.root(),
          result.in_spend_nf_1,
          result.in_spend_nf_2,
          result.out_send_nf_1,
          result.out_send_nf_2,
          result.out_cm_1,
          result.out_cm_2,
          result.blob, {
            from: account.address,
            gas: 5470000
          },
          function (err, result) {
            debug('Completed shielded transfer')
            if (err) reject (err)

            resolve(result)
          })

      }).catch(err => reject(err))
  })
}
