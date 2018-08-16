import web3, {createShieldedTransfer, createUnshielding, getGasPrice} from './web3'
import BN from 'bn.js'
import co from 'co'
import config from '../config'
import NoteError from '../errors/note-error'
import BalanceError from '../errors/balance-error'
import {makeTx} from './wallet'

const debug = require('debug')('note')

/**
 * Create note from event
 *
 * @param event
 */
export const noteFromEvent = (event) => {
  return {
    rho: '?',
    transactionHash: event.transactionHash,
    value: new BN(event.value),
    uuid: event.returnValues.uuid,
    from: event.returnValues.from,
    contractAddress: event.address,
    tracker: '?',
  }
}

/**
 * Create note
 *
 * @param tracker
 * @param rho
 * @param {BN} value
 * @param address
 * @param tokenContract
 */
export const createNote = (tracker, rho, value, address, tokenContract) => {
  const pk = tracker.a_pk
  const cm = web3.zsl.getCommitment(rho, pk, value)

  return {
    rho,
    value,
    uuid: web3.toHex(web3.utils.sha3(cm, {encoding: 'hex'})),
    address,
    confirmed: true,
    ztoken: tokenContract.address,
    tracker: tracker.uuid,
  }
}

/**
 * Merge notes
 *
 * @param {{}} tracker
 * @param {BN} amount
 * @param account
 * @param tokenContract
 */
export const mergeNotes = (tracker, amount, account, tokenContract) => {
  const notes = tracker.notes.find(n => n.account === account.address) // Filter account notes
  const {unspent, value} = searchUTXO(notes, amount)

  const change = value.sub(amount)
  debug('Total filtered : ' + value + ' + change : ' + change)

  if (unspent.length > config.maxUnshieldings) { throw new NoteError('Maximum unshieldings has been reached', 'MAX_UNSHIELDINGS') }

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
  return co(function* () {
    const cm = yield web3.zsl.getCommitment(note.rho, tracker.a_pk, note.value)
    const unsh = yield createUnshielding(note, tracker, tokenContract, cm)
    const root = tokenContract.root()

    return yield tokenContract.unshield(unsh.proof, unsh.spend_nf, cm, root, note.value, {from: address, gas: config.unshieldGas})
  })
}

/**
 * Shield a note
 *
 * @param tracker
 * @param value
 * @param address
 * @param tokenContract
 * @return {Promise<any>}
 */
export const shieldNote = (tracker, value, address, tokenContract) => {
  return co(function* () {
    const rho = yield web3.zsl.getRandomness()

    debug('Generating proof for shielding - value : ' + value)
    const result = yield web3.zsl.createShielding(rho, tracker.a_pk, value.toNumber())
    debug('Generating finished')

    const note = {
      rho,
      value,
      uuid: web3.utils.toHex(web3.utils.sha3(result.cm, {encoding: 'hex'})),
      tokenContract: tokenContract.address,
      confirmed: false,
      address,
    }

    yield tokenContract.methods.shield(result.proof, result.send_nf, result.cm, value)
      .send({from: address, gas: 200000})

    return note
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
  return co(function* () {
    const gasPrice = yield getGasPrice()
    if (tBalance.lt(gasPrice.mul(tracker.notes.length))) {
      throw new BalanceError('Not enough balance to unshield all notes')
    }

    // Simultaneously unshield all notes (async)
    yield tracker.notes.map(note => {
      return unshieldNote(note, tracker, account.address, tokenContract)
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
 * Search unspent transactions outputs
 *
 * @param {array} notes
 * @param {BN} amount
 * @return {{utxos: Array, value: BN}}
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
  const sortedNotes = notes.slice().sort((a, b) => a.value.sub(b.value))

  // Find bigger match
  const biggerMatch = sortedNotes.find(n => n.value.gt(amount))
  if (biggerMatch) {
    debug('Found bigger note match')
    return {
      unspent: [biggerMatch],
      value: biggerMatch.value,
    }
  }

  // Find multiple until total is more or exact match
  const foundNotes = []
  let total = new BN(0)
  sortedNotes.forEach(n => {
    if (total.lt(amount)) {
      foundNotes.push(n)
      total = total.add(n.value)
    }
  })

  const totalFound = foundNotes.reduce((acc, n) => acc.add(n.value), new BN(0))
  if (totalFound.lt(amount)) {
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
    const decrypted = yield web3.zsl.noteDecrypt(tracker.a_sk, blob)

    return createNote(tracker, decrypted.out_rho_1, new BN(decrypted.value), address, tokenContract)
  })
}

/**
 * Send shielded note to an address
 */
export const sendNote = (note, amount, recipientApk, account, tracker, tokenContract) => {
  return co(function* () {
    debug('Started sendNote')
    if (note.value.lt(amount)) {
      throw new NoteError('Cannot transfer ' + amount + ' as note value of ' + note.value + ' is too small.', 'NOT_ENOUGH_NOTE_VALUE')
    }

    const change = note.value.sub(amount)
    const outRho1 = yield web3.zsl.getRandomness()
    const outRho2 = yield web3.zsl.getRandomness()

    const shTransfer = yield createShieldedTransfer(note, tracker, amount, change, tokenContract, recipientApk, outRho1, outRho2)

    debug('Finishd sendNote' + JSON.stringify(shTransfer))

    const n1 = {
      value: amount,
      rho: outRho1,
      uuid: web3.toHex(web3.utils.sha3(shTransfer.out_cm_1, {encoding: 'hex'})),
      ztoken: tokenContract.address,
      confirmed: false,
      address: null,
      tracker: null,
    }

    debug('Recipient receives note of ' + amount + ' ' + tokenContract.name())

    let n2 = {}
    if (change.gt(0)) {
      n2 = {
        value: change,
        rho: outRho2,
        uuid: web3.toHex(web3.utils.sha3(shTransfer.out_cm_2, {encoding: 'hex'})),
        ztoken: tokenContract.address,
        confirmed: false,
        address: account.address(),
        tracker: tracker.uuid,
      }
    }

    debug('Sender receives change of ' + change + ' ' + tokenContract.name())
    debug('Submit shielded transfer to z-contract...')

    yield tokenContract.shieldedTransfer(
      shTransfer.proof,
      tokenContract.root(),
      shTransfer.in_spend_nf_1,
      shTransfer.in_spend_nf_2,
      shTransfer.out_send_nf_1,
      shTransfer.out_send_nf_2,
      shTransfer.out_cm_1,
      shTransfer.out_cm_2,
      shTransfer.blob, {
        from: account.address,
        gas: 5470000
      })

    const shlddTx = {
      n: note,
      n1: n1,
      n2: n2,
      to: recipientApk,
    }

    debug('Completed shielded transfer', shlddTx)

    return {transfer: shTransfer, tx: shlddTx}
  })
}
