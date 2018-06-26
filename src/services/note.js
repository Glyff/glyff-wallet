import web3, {createUnshielding, getGasPrice} from './web3'
import _ from 'lodash'
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
  const sortedNotes = _.orderBy(tracker.notes, ['value'], ['asc'])
  const notes = sortedNotes.find(n => n.account === account.address)

  const unspent = searchUTXO(notes, amount)

  // TODO values in notes will be stored as BigNumber, use sum method for BigNumber
  const total = web3.fromWei(new BigNumber(_.sumBy(unspent, 'value'), 'glyff'))
  const change = total.minus(amount)
  debug('total filtered : ' + total.toString() + ' + change : ' + change.toString())

  if (unspent.length > config.maxUnshieldings) {
    throw new NoteError('Maximum unshieldings has been reached', 'MAX_UNSHIELDINGS')
  }
  debug('UTXO is ' + JSON.stringify(unspent))

  return co(function* () {
    // Simultaneously unshield all notes (async)
    yield unspent.map(u => {
      return unshieldNote(unspent, tracker, account.address, tokenContract)
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

    debug('[*] Generating proof for shielding - value : ' + value)
    // TODO is this sync method? is there async alternative?
    const result = web3.zsl.createShielding(rho, tracker.a_pk, value)
    debug('[*] Generating finished')

    const note = {
      rho,
      value,
      uuid: web3.toHex(web3.sha3(result.cm, {encoding: 'hex'})),
      ztoken: ztoken.address,
      confirmed: false,
      account: address,
      tracker: tracker.id,
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
  const pk = tracker.a_pk;
  const cm = web3.zsl.getCommitment(rho, pk, value);

  return {
    rho,
    value,
    account: address,
    confirmed: true,
    ztoken: tokenContract.address,
    uuid: web3.toHex(web3.sha3(cm, {encoding: 'hex'})),
  }
}

/**
 * Search unspent transactions outputs
 *
 * @param {array} notes
 * @param {BigNumber} amount
 * @return {array}
 */
export const searchUTXO = (notes, amount) => {
  // TODO

  // Should throw exception if can't find appropriate set of outputs

  // if (found.length === 0) {
  //   throw new NoteError('No unspent notes were found', 'NO_UNSPENT')
  // }
}
