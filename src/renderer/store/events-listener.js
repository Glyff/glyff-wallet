import store from './index'
import bus from '../bus'

bus.on('gly-transfer', (tx) => {
  store.dispatch('glyTransfer', tx)
})

bus.on('glx-transfer', (tx) => {
  store.dispatch('glxTransfer', tx)
})

bus.on('shielding', (event) => {
  console.log('shielding')
})

bus.on('unshielding', (event) => {
  console.log('unshielding')
})

bus.on('shielded-transfer', (event) => {
  console.log('shielded-transfer')
})

bus.on('synced-blocks-to', (block) => {
  store.commit('UPDADE_SYNCING_BLOCK', block)
})

bus.on('synced-blocks-from', (block) => {
  store.commit('UPDADE_SYNCING_BLOCK', block)
})

bus.on('new-block', (block) => {
  store.commit('NEW_BLOCK', block)
})
