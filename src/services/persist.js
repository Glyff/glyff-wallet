import co from 'co'
import fs from 'fs-extra'
import BN from 'bn.js'
import moment from 'moment'
import Joi from 'joi'
import config from '../config'
import PersistError from '../errors/persist-error'
import merge from 'lodash-es/merge'
import web3 from './web3'

const accountsPath = config.homeDir + 'accounts.json'
const statePath = config.homeDir + 'state.json'

const accountsSchema = Joi.array().items(
  Joi.object().keys({
    name: Joi.string(),
    balance: Joi.string(),
    glxBalance: Joi.string(),
    address: Joi.string().required(),
  }).options({ stripUnknown: true }) // Remove unknown keys
)

const stateSchema = Joi.object().keys({
  trackers: Joi.object(),
  transactions: Joi.object(),
  currentBlock: Joi.number().allow(null),
  oToken: Joi.object().keys({
    address: Joi.string(),
    abi: Joi.array(),
  }),
}).options({ stripUnknown: true }) // Remove unknown keys

/**
 * Load accounts
 *
 * @return {*}
 */
const loadAccounts = () => {
  if (! fs.existsSync(accountsPath)) throw new PersistError('Accounts file is missing')
  const accountsRaw = fs.readJsonSync(accountsPath)

  const result = Joi.validate(accountsRaw, accountsSchema)
  if (result.error) {
    throw new PersistError('Accounts file validation failed')
  }

  // Process and return accounts data
  return result.value.map(account => {
    account.address = web3.utils.toChecksumAddress(account.address)
    account.balance = new BN(account.balance)
    account.glxBalance = new BN(account.glxBalance)
    return account
  })
}

/**
 * Load all other application state
 *
 * @return {*}
 */
const loadState = () => {
  // If can't find state file, just return loaded acconts
  if (! fs.existsSync(statePath)) return {}
  const state = fs.readJsonSync(statePath)
  // console.log(state)
  const validate = Joi.validate(state, stateSchema)

  // If state data is not valid, return only loaded accounts
  if (validate.error) {
    console.error('State validation failed', validate.error)
    return {}
  }

  // Convert transactions data
  Object.keys(state.transactions).forEach(addr => {
    state.transactions[addr].forEach(tx => {
      tx.value = new BN(tx.value)
      tx.date = moment(tx.date)
    })
  })

  // Convert trackers data
  Object.keys(state.trackers).forEach(addr => {
    state.trackers[addr].forEach(tracker => {
      tracker.balance = new BN(tracker.balance)
      tracker.notes.forEach(note => {
        note.value = new BN(note.value)
        if (note.date) note.date = moment(note.date)
      })
      tracker.spent.forEach(note => {
        note.value = new BN(note.value)
        if (note.date) note.date = moment(note.date)
      })
    })
  })

  return state
}

/**
 * Restore state
 *
 * @return {*}
 */
export const restoreState = (store) => {
  const accounts = loadAccounts()
  const state = loadState()

  const allState = {
    general: {
      currentBlock: state.currentBlock,
      oToken: state.oToken,
    },
    accounts: {
      accounts,
      transactions: state.transactions,
    },
    trackers: {
      trackers: state.trackers,
    }
  }

  if (allState) {
    store.replaceState(merge(store.state, allState))
  }

  return state
}

/**
 * Save state
 *
 * @param state
 * @return {*}
 */
export const saveState = (state) => {
  // if (state) return // Don't save state, for debugging
  const transactions = merge({}, state.accounts.transactions)
  const trackers = merge({}, state.trackers.trackers)

  // Stringify needed accounts data
  const accounts = state.accounts.accounts.map(a => {
    return {
      name: a.name,
      address: a.address,
      balance: a.balance ? a.balance.toString() : '0',
      glxBalance: a.glxBalance ? a.glxBalance.toString() : '0',
    }
  })

  // Stringify transactions data
  Object.keys(transactions).forEach(addr => {
    transactions[addr].forEach(tx => {
      tx.value = tx.value.toString(10)
      tx.date = tx.date.format('YYYY-MM-YY hh:mm:ss')
    })
  })

  // Stringify trackers data
  Object.keys(trackers).forEach(addr => {
    trackers[addr].forEach(tracker => {
      tracker.balance = tracker.balance.toString()
      tracker.notes.forEach(note => {
        note.value = note.value.toString()
        if (note.date) note.date = note.date.format('YYYY-MM-YY hh:mm:ss')
      })
      tracker.spent.forEach(note => {
        note.value = note.value.toString()
        if (note.date) note.date = note.date.format('YYYY-MM-YY hh:mm:ss')
      })
    })
  })

  const stateData = {
    transactions,
    trackers,
    currentBlock: state.general.currentBlock,
    oToken: state.general.oToken,
  }

  if (! fs.existsSync(config.homeDir)) {
    fs.mkdirSync(config.homeDir)
  }

  return co(function* () {
    fs.writeJsonSync(accountsPath, accounts)
    fs.writeJsonSync(statePath, stateData)
  })
}
