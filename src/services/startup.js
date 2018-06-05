/*
 * App startup service
 */

import fs from 'fs'
import co from 'co'
import web3, {connect as web3Connect} from './web3'
import config from '../config'
import {readJsonFile} from '../utils/fs'
// import watchToken from './blockchain'

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
      return {installation: true}
    }

    if (! allFilesExist()) {
      return {filesCorrupted: true}
    }

    yield web3Connect()

    const oToken = yield readJsonFile(config.homeDir + 'default_token.json')
    const tokenContract = web3.eth.contract(oToken.abi).at(oToken.address)
    // watchToken(tokenContract)

    const [accounts, stBuffer, notesBuffer, tmpTxs] = yield [
      readJsonFile(config.homeDir + 'accounts.json'),
      readJsonFile(config.homeDir + 'scache.json'),
      readJsonFile(config.homeDir + 'cache.json'),
      readJsonFile(config.homeDir + 'transactions.json'),
    ]

    return {
      oToken,
      tokenContract,
      accounts,
      stBuffer,
      notesBuffer,
      tmpTxs,
    }
  })
}
