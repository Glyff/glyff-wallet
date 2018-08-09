<template>
  <modal :value="show" @input="hideUnlock()" title="Unlock Account">
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="form-group">
      <label class="control-label">Password</label>
      <input type="password" v-model="password" class="form-control" placeholder="Your account password">
    </div>
    <div slot="footer" class="text-right">
      <button class="btn btn-primary" @click="unlock">Unlock Account</button>
      <button class="btn btn-default" @click="hideUnlock()">Close</button>
    </div>
  </modal>
</template>

<script>
import {Modal} from 'uiv'
import {mapState, mapGetters, mapActions, mapMutations} from 'vuex'
import pick from 'lodash-es/pick'

export default {
  components: {
    Modal,
  },

  data () {
    return {
      error: '',
      password: '',
    }
  },

  watch: {
    show (show) {
      this.error = ''
    },
  },

  computed: {
    ...mapState({
      show: s => s.accounts.showUnlock,
    }),

    ...mapGetters({
      account: 'currentAccount',
    }),
  },

  methods: {
    ...mapActions({
      unlockAccount: 'unlockAccount',
    }),

    ...mapMutations({
      hideUnlock: 'HIDE_UNLOCK',
    }),

    unlock () {
      this.error = ''
      this.unlockAccount(pick(this, ['account', 'password']))
        .then(() => this.hideUnlock())
        .catch(e => (this.error = e.message))
    },
  },
}
</script>
