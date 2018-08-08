<template>
  <div>
    <modal :value="value" @input="$emit('input', $event)" title="Edit account">
      <div class="form-group" :class="{'has-error': hasErrors('name')}">
        <label class="control-label">Account Name</label>
        <input type="text" v-model="name" class="form-control" placeholder="Your account name">
        <span class="help-block" v-if="hasErrors('name')">{{ getErrors('name') }}</span>
      </div>
      <div slot="footer" class="text-right">
        <button class="btn btn-primary" @click="update()">Save</button>
        <button class="btn btn-default" @click="$emit('input', false)">Close</button>
      </div>
    </modal>
  </div>
</template>

<script>
import {Modal} from 'uiv'
import {mapActions} from 'vuex'
import pick from 'lodash-es/pick'
import Validator from 'validatorjs'

export default {
  components: {
    Modal,
  },

  props: ['value', 'account'],

  data () {
    return {
      name: '',
      errors: {},
    }
  },

  watch: {
    value (show) {
      if (show) this.name = this.account.name
    },
  },

  methods: {
    ...mapActions({
      updateAccount: 'update',
    }),

    update () {
      if (! this.validate()) return

      this.updateAccount({address: this.account.address, name: this.name})
      this.$emit('input', false)
      this.name = ''
    },

    validate () {
      const validation = new Validator(pick(this, ['name']), {
        name: 'required',
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
