<template>
  <div>
    <modal :value="show" @input="hideNewAccount()" :backdrop="closable" :dismiss-btn="closable" title="Create new account">
      <div v-if="message" class="alert alert-warning">{{ message }}</div>
      <div class="form-group" :class="{'has-error': hasErrors('name')}">
        <label class="control-label">Account Name</label>
        <input type="text" v-model="name" class="form-control" placeholder="Your account name">
        <span class="help-block" v-if="hasErrors('name')">{{ getErrors('name') }}</span>
      </div>
      <div class="form-group" :class="{'has-error': hasErrors('password')}">
        <label class="control-label">Password</label>
        <input type="password" v-model="password" class="form-control" placeholder="Your account password">
        <span class="help-block" v-if="hasErrors('password')">{{ getErrors('password') }}</span>
      </div>
      <div slot="footer" class="text-right">
        <button class="btn btn-primary" @click="create()">Create Account</button>
        <button class="btn btn-default" v-if="closable" @click="hideNewAccount()">Close</button>
      </div>
    </modal>
  </div>
</template>

<script>
import {Modal} from 'uiv'
import {mapState, mapActions, mapMutations} from 'vuex'
import pick from 'lodash-es/pick'
import Validator from 'validatorjs'

export default {
  components: {
    Modal,
  },

  data () {
    return {
      name: '',
      password: '',
      errors: {},
      message: '',
    }
  },

  beforeMount () {
    if (! this.accounts.length) {
      this.showNewAccount()
      this.message = 'You don\'t have any accounts, please create one to proceed'
    }
  },

  computed: {
    ...mapState({
      accounts: s => s.accounts.accounts,
      show: s => s.general.showNewAccount,
    }),

    closable () {
      return !! this.accounts.length
    }
  },

  methods: {
    ...mapActions({
      createAccount: 'createAccount',
    }),

    ...mapMutations({
      hideNewAccount: 'HIDE_NEW_ACCOUNT',
      showNewAccount: 'SHOW_NEW_ACCOUNT',
    }),

    create () {
      if (! this.validate()) return

      this.createAccount(pick(this, ['name', 'password']))
        .then(() => {
          this.hideNewAccount()
          this.name = ''
          this.password = ''
        })
    },

    validate () {
      const validation = new Validator(pick(this, ['name', 'password']), {
        name: 'required',
        password: 'required|min:6',
      })

      if (validation.fails()) {
        this.errors = validation.errors.errors
        return false
      } else {
        this.errors = {}
        return true
      }
    },

  },
}
</script>
