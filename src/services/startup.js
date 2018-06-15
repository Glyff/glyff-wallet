/*
 * App startup service
 */

import fs from 'fs-extra'
import co from 'co'
import web3, {isUnlocked} from './web3'
import config from '../config'
import {loadTrackers} from './tracker'
// import watchToken from './blockchain'

const debug = require('debug')('startup')

const files = ['accounts.json', 'scache.json', 'cache.json', 'transactions.json']

/**
 * Check if glyff home folder exists
 *
 * @return {boolean}
 */
const homeExists = () => fs.existsSync(config.homeDir)

/**
 * Check if all requried files exist in the home folder
 *
 * @return {boolean}
 */
const allFilesExist = () => files.every(file => fs.existsSync(config.homeDir + file))

/**
 * Async startup function
 */
export default function () {
  return co(function* () {
    if (! homeExists()) {
      debug('Home folder does not exist!')
      return {installation: true}
    }

    if (! allFilesExist()) {
      debug('Some of required files are missing!')
      return {filesCorrupted: true}
    }

    const oToken = yield fs.readJson(config.homeDir + 'default_token.json')
    const tokenContract = web3.eth.contract(oToken.abi).at(oToken.address)
    // watchToken(tokenContract)

    try {
      var [accounts, stBuffer, notesBuffer, transactions] = yield [
        fs.readJson(config.homeDir + 'accounts.json'),
        fs.readJson(config.homeDir + 'scache.json'),
        fs.readJson(config.homeDir + 'cache.json'),
        fs.readJson(config.homeDir + 'transactions.json'),
      ]
    } catch (e) {
      debug('Some files are corrupted!')
      return {filesCorrupted: true}
    }

    // Check if accounts are locked (asyncronously)
    accounts = yield accounts.map(a => {
      return co(function* () {
        a.unlocked = yield isUnlocked(a)
        return a
      })
    })

    const trackers = yield loadTrackers(config.homeDir)

    return {
      oToken,
      tokenContract,
      accounts,
      stBuffer,
      notesBuffer,
      transactions,
      trackers,
    }
  })
}
