import Vue from 'vue'
import {fromWei} from '../services/web3'

Vue.filter('ether', (value, suffix = 'gly', type = 'GLY') => {
  if (typeof value === 'undefined') return 0

  return fromWei(value + '', type) + (suffix ? ' ' + suffix : '')
})

Vue.filter('truncate', (text, length = 30, clamp = '...') => {
  if (text.length <= length) return text

  let tcText = text.slice(0, length - clamp.length)
  let last = tcText.length - 1

  while (last > 0 && tcText[last] !== ' ' && tcText[last] !== clamp[0]) last -= 1

  // Fix for case when text dont have any `space`
  last = last || length - clamp.length

  tcText = tcText.slice(0, last)

  return tcText + clamp
})
