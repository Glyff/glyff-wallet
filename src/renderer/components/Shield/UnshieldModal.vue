<template>
  <modal :value="value" @input="$emit('input', $event)" title="Unshield Funds" size="lg">
    <div class="form-group" :class="{'has-error': hasErrors('tracker')}">
      <label class="control-label">From Z-Address</label>
      <multiselect :options="trackers"
                   v-model="tracker"
                   track-by="zaddr"
                   label="zaddr"
                   :searchable="false"
                   :allow-empty="false"
                   :show-labels="false"
      ></multiselect>
      <span class="help-block" v-if="hasErrors('tracker')">{{ getErrors('tracker') }}</span>
    </div>

    <div class="form-group" :class="{'has-error': hasErrors('amount')}">
      <label>Amount</label>
      <div class="row">
        <div class="col-sm-6">
          <input v-model="amount" class="form-control" placeholder="0.0">
        </div>
        <div class="col-sm-6 pt-5">
          {{ glsBalance | ether('', 'GLS') }} available
        </div>
      </div>
      <span class="help-block" v-if="hasErrors('amount')">{{ getErrors('amount') }}</span>
    </div>

    <div slot="footer" class="text-right">
      <button class="btn btn-primary" @click="unshield()">Unshield</button>
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
import BN from 'bn.js'

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
      account: 'currentAccount',
    }),

    glsBalance () {
      return this.tracker ? this.tracker.balance : new BN(0)
    },
  },

  methods: {
    ...mapMutations({
      showUnlock: 'SHOW_UNLOCK',
    }),

    ...mapActions({
      unshieldAction: 'unshield',
      toast: 'addToastMessage',
    }),

    unshield () {
      if (! this.validate()) return
      if (this.account.locked) return this.showUnlock()

      this.unshieldAction({tracker: this.tracker, amount: toWei(this.amount, 'GLX')})
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
      const validation = new Validator(pick(this, ['amount', 'tracker']), {
        tracker: 'required',
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
