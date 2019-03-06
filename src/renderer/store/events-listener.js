import store from './index'
import bus from '../bus'

bus.on('gly-transfer', (tx) => {
  store.dispatch('glyTransfer', tx)
})

bus.on('glx-transfer', (tx) => {
  store.dispatch('glxTransfer', tx)
})

bus.on('shielding', (data) => {
  store.dispatch('newShielding', data)
})

bus.on('unshielding', (data) => {
  store.dispatch('newUnshielding', data)
})

bus.on('shielded-transfer', (data) => {
  store.dispatch('newShieldedTransfer', data)
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
