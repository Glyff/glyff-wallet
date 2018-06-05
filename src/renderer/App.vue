<template>
  <div id="app">
    <layout></layout>
  </div>
</template>

<script>
import {mapActions} from 'vuex'
import Layout from './components/Layout/Layout'

export default {
  name: 'glyff-wallet',

  components: {
    Layout,
  },

  mounted () {
    this.startApp()
  },

  methods: {
    ...mapActions({
      startApp: 'general/start',
    }),
  },
}
</script>
