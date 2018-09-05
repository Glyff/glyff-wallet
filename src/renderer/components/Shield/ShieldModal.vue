<template>
  <modal :value="value" @input="$emit('input', $event)" title="Shield Funds" size="lg">
    <div class="form-group" :class="{'has-error': hasErrors('zAddress')}">
      <label class="control-label">To Z-Address</label>
      <multiselect :options="trackers"
                   v-model="tracker"
                   track-by="zaddr"
                   label="zaddr"
                   :searchable="false"
                   :allow-empty="false"
                   :show-labels="false"
      ></multiselect>
      <span class="help-block" v-if="hasErrors('zAddress')">{{ getErrors('zAddress') }}</span>
    </div>

    <div class="form-group" :class="{'has-error': hasErrors('amount')}">
      <label>Amount</label>
      <div class="row">
        <div class="col-sm-6">
          <input v-model="amount" class="form-control" placeholder="0.0">
        </div>
        <div class="col-sm-6 pt-5">
          {{ glxBalance | ether('', 'GLX') }} available
        </div>
      </div>
      <span class="help-block" v-if="hasErrors('amount')">{{ getErrors('amount') }}</span>
    </div>

    <div slot="footer" class="text-right">
      <button class="btn btn-primary" @click="shield()">Shield</button>
      <button class="btn btn-default" @click="$emit('input', false)">Close</button>
    </div>
  </modal>
</template>

<script>
import {mapGetters, mapActions, mapMutations} from 'vuex'
import {Modal} from 'uiv'
import pick from 'lodash-es/pick'
import Validator from 'validatorjs'
import Multiselect from 'vue-multiselect/src/Multiselect.vue'
import {toWei} from '../../../services/web3'

export default {
  components: {
    Modal,
    Multiselect,
  },

  props: ['value'],

  data () {
    return {
      message: '',
      tracker: null,
      amount: '',
      errors: {},
    }
  },

  watch: {
    value (show) {
      if (show) this.tracker = this.trackers[0]
    },
  },

  computed: {
    ...mapGetters({
      trackers: 'currentTrackers',
      glxBalance: 'glxBalance',
      account: 'currentAccount',
    }),
  },

  methods: {
    ...mapMutations({
      showUnlock: 'SHOW_UNLOCK',
    }),

    ...mapActions({
      shieldAction: 'shield',
      toast: 'addToastMessage',
    }),

    shield () {
      if (! this.validate()) return
      if (this.account.locked) return this.showUnlock()

      this.shieldAction({tracker: this.tracker, amount: toWei(this.amount, 'GLX')})
        .then(() => {
          this.$emit('input', false)
          this.toast({text: 'Successfully send shieling transaction, please wait until it\'s mined', type: 'success'})
        })
        .catch(err => {
          if (err.message.includes('authentication')) {
            this.toast({text: 'You need to unlock your accounts first!', type: 'danger'})
            this.showUnlock()
          } else {
            this.toast({text: err.message, type: 'danger'})
          }
        })
    },

    validate () {
      const validation = new Validator(pick(this, ['amount']), {
        amount: 'required|numeric|min:0.00000000000001',
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
