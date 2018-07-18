import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import toast from './toast'
import general from './general'
import trackers from './trackers'
import accounts from './accounts'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

const plugins = []

if (debug) plugins.push(createLogger())

export default new Vuex.Store({
  modules: {
    toast,
    general,
    trackers,
    accounts,
  },
  strict: ! debug,
  plugins,
})
