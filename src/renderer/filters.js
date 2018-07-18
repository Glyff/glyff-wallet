import Vue from 'vue'
import {fromWei} from '../services/web3'

Vue.filter('ether', (value, suffix = 'gly', type = 'GLY') => {
  return fromWei(value + '', type) + (suffix ? ' ' + suffix : '')
})
