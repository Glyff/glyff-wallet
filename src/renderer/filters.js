import Vue from 'vue'
import {fromWei} from '../services/web3'

Vue.filter('ether', (value, suffix = 'gly', type = 'GLY') => {
  if (typeof value === 'undefined') return 0

  return fromWei(value + '', type) + (suffix ? ' ' + suffix : '')
})
