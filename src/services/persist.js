import co from 'co'
import fs from 'fs-extra'
import BN from 'bn.js'
import moment from 'moment'
import Joi from 'joi'
import config from '../config'
import PersistError from '../errors/persist-error'
import merge from 'lodash-es/merge'

const accountsPath = config.homeDir + 'accounts.json'
const statePath = config.homeDir + 'state.json'

const accountsSchema = Joi.array().items(
  Joi.object().keys({
    name: Joi.string(),
    address: Joi.string().required(),
  }).options({ stripUnknown: true }) // Remove unknown keys
)

const stateSchema = Joi.object().keys({
  trackers: Joi.object(),
  transactions: Joi.object(),
}).options({ stripUnknown: true }) // Remove unknown keys

/**
 * Load accounts
 *
 * @return {*}
 */
const loadAccounts = () => {
  if (! fs.existsSync(accountsPath)) throw new PersistError('Accounts file is missing')
  const accounts = fs.readJsonSync(accountsPath)

  const result = Joi.validate(accounts, accountsSchema)
  if (result.error) {
    throw new PersistError('Accounts file validation failed')
  }

  return result.value
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
  console.log(state)

  // If state data is not valid, return only loaded accounts
  if (Joi.validate(state, stateSchema).error) return {}

  // Convert transactions data
  Object.keys(state.transactions).forEach(addr => {
    state.transactions[addr].forEach(tx => {
      tx.amount = new BN(tx.amount)
      tx.date = moment(tx.date)
    })
  })

  console.log(state)

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
  const transactions = merge({}, state.accounts.transactions)
  const trackers = merge({}, state.trackers.trackers)

  // Stringify transactions data
  Object.keys(transactions).forEach(addr => {
    transactions[addr].forEach(tx => {
      tx.amount = tx.amount.toString(10)
      tx.date = tx.date.format('YYYY-MM-YY hh:mm:ss')
    })
  })

  return co(function* () {
    fs.writeJsonSync(accountsPath, state.accounts.accounts)
    fs.writeJsonSync(statePath, {transactions, trackers})
  })
}
