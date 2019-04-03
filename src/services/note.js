import web3, {createShieldedTransfer, getGasPrice} from './web3'
import BN from 'bn.js'
import co from 'co'
import config from '../config'
import NoteError from '../errors/note-error'
import BalanceError from '../errors/balance-error'

const debug = require('debug')('app:note')

/**
 * Find note and trackers in trackers list by uuid
 *
 * @param trackers
 * @param uuid
 * @param confirmed
 */
export const findNoteAndTracker = (trackers, uuid, confirmed = false) => {
  let note
  let tracker
  let address

  // Search all accounts
  Object.keys(trackers).find(addr => {
    // Search all trackers in account
    return trackers[addr].find(accTracker => {
      let n = accTracker.notes.find(note => note.uuid === uuid)
      if (n && n.confirmed === confirmed) {
        note = n
        tracker = accTracker
        address = addr

        return true
      }
      return false
    })
  })

  return {address, tracker, note}
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
  return co(function* () {
    const {notes, value} = searchUTXO(tracker.notes, amount)
    const change = value.sub(amount)
    debug('mergeNotes: total filtered : ' + value + ' + change : ' + change, notes)

    if (notes.length > config.maxUnshieldings) throw new NoteError('Maximum unshieldings has been reached', 'MAX_UNSHIELDINGS')

    // If we have exact one note match, just return it
    if (notes.length === 1) return notes[0]

    // Simultaneously unshield all notes (async)
    yield notes.map(note => {
      return unshieldNote(note, tracker, account.address, tokenContract)
    })

    return yield shieldNote(tracker, amount, account.address, tokenContract)
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

    debug('shieldNote: generating proof for shielding - value : ' + value)
    const result = yield web3.zsl.createShielding(rho, tracker.a_pk, value.toNumber())
    debug('shieldNote: generating finished')

    const txHash = yield new Promise((resolve, reject) => {
      tokenContract.methods.shield(result.proof, result.send_nf, result.cm, value.toNumber())
        .send({from: address, gas: config.shieldGas}, (err, hash) => {
          if (err) reject(err)
          resolve(hash)
        })
    })

    return {
      txHash,
      rho,
      value,
      uuid: web3.utils.toHex(web3.utils.sha3(result.cm, {encoding: 'hex'})),
      contract: tokenContract.options.address,
      address,
      confirmed: false,
    }
  })
}

/**
 * Unshield single note
 *
 * @param note
 * @param tracker
 * @param address
 * @param tokenContract
 * @return {Promise<string>} Tx hash
 */
export const unshieldNote = (note, tracker, address, tokenContract) => {
  return co(function* () {
    debug('unshieldNote', {note, tracker, address, tokenContract})
    debug('unshieldNote: generating proof for unshielding')
    const cm = yield web3.zsl.getCommitment(note.rho, tracker.a_pk, note.value.toNumber())
    const witnesses = yield tokenContract.methods.getWitness(cm).call()
    const treeIndex = parseInt(witnesses[0])
    const authPath = witnesses[1]
    const root = yield tokenContract.methods.root().call()
    // console.log({cm, witnesses, root})
    debug('unshieldNote: createUnshielding', {rho: note.rho, a_sk: tracker.a_sk, value: note.value.toNumber(), treeIndex, authPath})
    const unsh = yield web3.zsl.createUnshielding(note.rho, tracker.a_sk, note.value.toNumber(), treeIndex, authPath)
    debug('unshieldNote: generating proof finished')

    debug('unshieldNote:', {proof: unsh.proof, spend_nf: unsh.spend_nf, cm, rt: root, value: note.value.toNumber(), from: address, gas: config.unshieldGas})

    return yield new Promise((resolve, reject) => {
      tokenContract.methods.unshield(unsh.proof, unsh.spend_nf, cm, root, note.value.toNumber())
        .send({from: address, gas: config.unshieldGas}, (err, hash) => {
          debug('unshieldNote: unshielding finished', {err, hash})
          if (err) reject(err)
          resolve(hash)
        })
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
 * Search unspent transactions outputs
 *
 * @param {array} notes
 * @param {BN} amount
 * @return {{utxos: Array, value: BN}}
 */
export const searchUTXO = (notes, amount) => {
  // Find exact match
  const exactMatch = notes.find(n => n.value.eq(amount))
  if (exactMatch) {
    debug('Found exact note match')
    return {
      notes: [exactMatch],
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
      notes: [biggerMatch],
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
    notes: foundNotes,
    value: totalFound,
  }
}

/**
 * Decrypt blob
 *
 * @param tracker
 * @param event
 * @param tokenContract
 * @return {*}
 */
export const decryptBlob = (tracker, event, tokenContract) => {
  return co(function* () {
    const decrypted = yield web3.zsl.noteDecrypt(tracker.a_sk, event.blob)
    debug('decryptBlob: decrypted', {decrypted})

    const rho = '0x' + decrypted.out_rho_1
    const value = new BN(decrypted.value)
    const cm = yield web3.zsl.getCommitment(rho, tracker.a_pk, value.toNumber())

    const note = {
      txHash: event.transactionHash,
      rho,
      value,
      uuid: web3.utils.toHex(web3.utils.sha3(cm, {encoding: 'hex'})),
      address: event.address,
      confirmed: true,
      contract: tokenContract.options.address,
    }

    return {note, tracker}
  }).catch(err => {
    debug('decryptBlob: could not decrypt note: ' + err.message)
    return null
  })
}

/**
 * Send shielded note to an address
 */
export const sendNote = (note, amount, zaddress, account, tracker, tokenContract) => {
  return co(function* () {
    debug('sendNote started')
    if (note.value.lt(amount)) {
      throw new NoteError('Cannot transfer ' + amount + ' as note value of ' + note.value + ' is too small.', 'NOT_ENOUGH_NOTE_VALUE')
    }

    const change = note.value.sub(amount)
    const outRho1 = yield web3.zsl.getRandomness()
    const outRho2 = yield web3.zsl.getRandomness()

    debug('sendNote: createShieldedTransfer started', {note, tracker, amount, change, tokenContract, zaddress, outRho1, outRho2})
    const shTransfer = yield createShieldedTransfer(note, tracker, amount, change, tokenContract, zaddress, outRho1, outRho2)
    debug('sendNote: createShieldedTransfer finished', shTransfer)

    const sentNote = {
      value: amount,
      rho: outRho1,
      uuid: web3.utils.toHex(web3.utils.sha3(shTransfer.out_cm_1, {encoding: 'hex'})),
      contract: tokenContract.options.address,
      confirmed: false,
      address: null,
    }

    debug('sendNote: Recipient receives note of ' + amount)

    let changeNote = {}
    if (change.gt(0)) {
      debug('sendNote: Sender receives change of ' + change)
      changeNote = {
        value: change,
        rho: outRho2,
        uuid: web3.utils.toHex(web3.utils.sha3(shTransfer.out_cm_2, {encoding: 'hex'})),
        contract: tokenContract.options.address,
        confirmed: false,
        address: account.address,
      }
    }

    debug('sendNote: Submit shielded transfer to z-contract...')

    const root = yield tokenContract.methods.root().call()

    const txHash = yield new Promise((resolve, reject) => {
      tokenContract.methods.shieldedTransfer(
        shTransfer.proof,
        root,
        shTransfer.in_spend_nf_1,
        shTransfer.in_spend_nf_2,
        shTransfer.out_send_nf_1,
        shTransfer.out_send_nf_2,
        shTransfer.out_cm_1,
        shTransfer.out_cm_2,
        shTransfer.blob,
      )
        .send({from: account.address, gas: config.shieldedTransferGas}, (err, hash) => {
          debug('sendNote: transfer finished', {err, hash})
          if (err) reject(err)
          resolve(hash)
        })
    })
    debug('sendNote: Transaction hash: ' + txHash)

    const shlddTx = {
      txHash,
      note,
      sentNote,
      changeNote,
      to: zaddress,
    }

    debug('Completed shielded transfer', shlddTx)

    return shlddTx
  })
}
