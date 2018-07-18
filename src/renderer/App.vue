<template>
  <div id="app">
    <layout></layout>
  </div>
</template>

<script>
import co from 'co'
import {mapActions} from 'vuex'
import Layout from './components/Layout/Layout'

export default {
  name: 'glyff-wallet',

  components: {
    Layout,
  },

  mounted () {
    co(function* () {
      yield this.connect()
      yield this.startApp()
    }.bind(this))
  },

  methods: {
    ...mapActions({
      connect: 'general/connect',
      startApp: 'general/start',
      checkPastEvents: 'general/checkPastEvents',
    }),
  },
}
</script>
