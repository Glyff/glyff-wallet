<template>
  <div>
    <modal v-model="show" :backdrop="backdrop" title="Create new account">
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
        <button class="btn btn-default" @click="show = false">Close</button>
      </div>
    </modal>

    <button class="btn btn-primary mt-20" @click="show = true">Create Account</button>
  </div>
</template>

<script>
import {Modal} from 'uiv'
import {mapActions} from 'vuex'
import pick from 'lodash-es/pick'
import Validator from 'validatorjs'

export default {
  name: 'new-account',

  components: {
    Modal,
  },

  data () {
    return {
      show: false,
      backdrop: true,
      name: '',
      password: '',
      errors: {},
    }
  },

  computed: {
    //
  },

  methods: {
    ...mapActions({
      createAccount: 'accounts/create',
    }),

    create () {
      if (! this.validate()) return

      this.createAccount(pick(this, ['name', 'password']))
        .then(() => (this.show = false))
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
