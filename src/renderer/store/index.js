import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import general from './general'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

const plugins = []

if (debug) plugins.push(createLogger())

export default new Vuex.Store({
  modules: {
    general,
  },
  strict: ! debug,
  plugins,
})
