import Vue from 'vue'
import web3 from '../services/web3'

Vue.filter('ether', function (value, suffix) {
  return web3.fromWei(value, 'ether') + (' ' + suffix || ' eth')
})
