import Vue from 'vue'

Vue.mixin({
  methods: {
    onenLink (link) {
      this.$electron.shell.openExternal(link)
    },

    hasErrors (field) {
      return this.errors && this.errors[field] && this.errors[field].length
    },

    getErrors (field) {
      if (! this.hasErrors(field)) return ''

      return this.errors[field].join('<br>')
    },
  }
})
