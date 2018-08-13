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
    address: Joi.string().required(),
  }).options({ stripUnknown: true }) // Remove unknown keys
)

const stateSchema = Joi.object().keys({
  trackers: Joi.object().required(),
  transactions: Joi.object().required(),
  currentBlock: Joi.number().allow(null).required(),
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
      tx.amount = new BN(tx.amount)
      tx.date = moment(tx.date)
    })
  })

  // console.log(state)

  // TODO Convert trackes notes data

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
      balance: a.balance.toString(),
    }
  })

  // Stringify transactions data
  Object.keys(transactions).forEach(addr => {
    transactions[addr].forEach(tx => {
      tx.amount = tx.amount.toString(10)
      tx.date = tx.date.format('YYYY-MM-YY hh:mm:ss')
    })
  })

  const stateData = {
    transactions,
    trackers,
    currentBlock: state.general.currentBlock,
    oToken: state.general.oToken,
  }

  return co(function* () {
    fs.writeJsonSync(accountsPath, accounts)
    fs.writeJsonSync(statePath, stateData)
  })
}
