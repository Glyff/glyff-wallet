import fs from 'fs-extra'
import path from 'path'
import co from 'co'
import _ from 'lodash'

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
