import './assets/scss/index.scss'
import './legacy'
import Vue from 'vue'
import axios from 'axios'

import './filters'
import './mixins'
import App from './App'
import router from './router'
import store from './store'
import web3 from '../services/web3'
import debug from 'debug'
import './store/events-actions'

if (! process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

// Expose web3 and store for debugging
if (process.env.NODE_ENV === 'development') {
  debug.enable('*')
  global.web3 = web3
  global.store = store
}

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
