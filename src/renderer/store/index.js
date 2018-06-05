import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import modules from './modules'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

const plugins = []

if (debug) plugins.push(createLogger())

export default new Vuex.Store({
  modules,
  strict: ! debug,
  plugins,
})
