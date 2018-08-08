<template>
  <div>
    <modal v-model="show" :backdrop="closable" :dismiss-btn="closable" title="Create new account">
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
        <button class="btn btn-default" v-if="closable" @click="show = false">Close</button>
      </div>
    </modal>

    <button class="btn btn-primary mt-20" @click="show = true">Create Account</button>
  </div>
</template>

<script>
import {Modal} from 'uiv'
import {mapState, mapActions} from 'vuex'
import pick from 'lodash-es/pick'
import Validator from 'validatorjs'

export default {
  components: {
    Modal,
  },

  data () {
    return {
      show: false,
      name: '',
      password: '',
      errors: {},
      message: '',
    }
  },

  beforeMount () {
    if (! this.accounts.length) {
      this.show = true
      this.message = 'You don\'t have any accounts, please create one to proceed'
    }
  },

  computed: {
    ...mapState({
      accounts: s => s.accounts
    }),

    closable () {
      return !! this.accounts.length
    }
  },

  methods: {
    ...mapActions({
      createAccount: 'create',
    }),

    create () {
      if (! this.validate()) return

      this.createAccount(pick(this, ['name', 'password']))
        .then(() => {
          this.show = false
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
