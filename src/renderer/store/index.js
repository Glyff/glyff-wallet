import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import toast from './toast'
import general from './general'
import trackers from './trackers'
import accounts from './accounts'
import {restoreState, saveState} from '../../services/persist'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

const plugins = []

if (debug) plugins.push(createLogger())

const store = new Vuex.Store({
  modules: {
    toast,
    general,
    trackers,
    accounts,
  },
  strict: ! debug,
  plugins,
})

try {
  restoreState(store)
} catch (e) {
  console.warn(e.message)
}

window.addEventListener('beforeunload', evt => {
  saveState(store.state)
})

export default store
