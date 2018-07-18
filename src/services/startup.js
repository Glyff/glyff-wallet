/*
 * App startup service
 */

import fs from 'fs-extra'
import co from 'co'
import web3 from './web3'
import config from '../config'
import StartupError from '../errors/startup-error'
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
      throw new StartupError('Home folder does not exist!')
    }

    if (! allFilesExist()) {
      debug('Some of required files are missing!')
      throw new StartupError('Some of required files are missing!')
    }

    const oToken = yield fs.readJson(config.homeDir + 'default_token.json')
    const tokenContract = new web3.eth.Contract(oToken.abi, oToken.address)

    return {oToken, tokenContract}
  })
}
