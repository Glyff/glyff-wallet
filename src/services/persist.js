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
  trackers: Joi.array(),
  transactions: Joi.array(),
})

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

  // If state data is not valid, return only loaded accounts
  if (Joi.validate(state, stateSchema).error) return {}

  // Convert traansactions data
  state.transactions.forEach(tx => {
    tx.amount = new BN(tx.amount)
    tx.date = moment(tx.date)
    return tx
  })

  // TODO Convert trackes data

  return state
}

/**
 * Check and create missing trackers
 *
 * @param store
 */
const checkAndCreateTrackers = (store) => {
  store.state.accounts.accounts.forEach(account => {
    if (! store.state.trackers.trackers[account.address]) {
      store.commit('trackers/CREATE_TRACKER', account)
    }
  })
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
    if (store.state.accounts.accounts.length) {
      store.commit('accounts/CHANGE_ACCOUNT', store.state.accounts.accounts[0])
      checkAndCreateTrackers(store)
    }
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
  return co(function* () {
    // fs.writeJsonSync(path, state)
  })
}
