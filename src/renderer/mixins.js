import Vue from 'vue'

Vue.mixin({
  onenLink (link) {
    this.$electron.shell.openExternal(link)
  }
})
