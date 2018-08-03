<template>
  <modal :value="value" @input="$emit('input', $event)" title="Unlock Account">
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="form-group">
      <label class="control-label">Password</label>
      <input type="password" v-model="password" class="form-control" placeholder="Your account password">
    </div>
    <div slot="footer" class="text-right">
      <button class="btn btn-primary" @click="unlock">Unlock Account</button>
      <button class="btn btn-default" @click="$emit('input', false)">Close</button>
    </div>
  </modal>
</template>

<script>
import {Modal} from 'uiv'
import {mapActions} from 'vuex'
import pick from 'lodash-es/pick'

export default {
  components: {
    Modal,
  },

  props: ['value', 'account'],

  data () {
    return {
      error: '',
      password: '',
    }
  },

  watch: {
    value (show) {
      this.error = ''
    },
  },

  methods: {
    ...mapActions({
      unlockAccount: 'accounts/unlock',
    }),

    unlock () {
      this.error = ''
      this.unlockAccount(pick(this, ['account', 'password']))
        .then(() => this.$emit('input', false))
        .catch(e => (this.error = e.message))
    },
  },
}
</script>
