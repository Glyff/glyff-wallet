import fs from 'fs-extra'
import path from 'path'
import co from 'co'
import _ from 'lodash'
import web3 from './web3'
import uuid from 'uuid'

/**
 * Find and load all saved trackers (asyncronously)
 *
 * @param {string} dir
 * @return {Promise<any>}
 */
export const loadTrackers = (dir) => {
  return co(function* () {
    const files = yield fs.readdir(dir)

    const data = yield files.map(file => {
      if (path.extname(file) !== '.tracker') return
      return fs.readJson(path.resolve(dir, file))
    })

    return data.filter(i => ! _.isEmpty(i)) // Filter empty objects
  })
}

/**
 * Create tracker
 *
 * @return {*}
 */
export const createTracker = () => {
  return Object.assign({}, web3.zsl.GenerateZKeypair(), {
    id: 0,
    uuid: uuid.v4(),
    balance: 0,
    notes: [],
    spent: [],
    lastBlock: web3.eth.blockNumber,
  })
}
