import co from 'co'
import fs from 'fs-extra'
import config from '../config'
import {isUnlocked} from './web3'

/**
 * Load accounts from home dir
 *
 * @param {string} dir
 * @return {Promise<any>}
 */
export const loadAccounts = (dir) => {
  return co(function* () {
    let accounts = yield fs.readJson(config.homeDir + 'accounts.json')

    accounts = yield accounts.map(a => {
      return co(function* () {
        a.unlocked = yield isUnlocked(a)
        return a
      })
    })

    return accounts
  })
}
