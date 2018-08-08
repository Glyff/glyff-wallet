<template>
  <div id="send-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Send<br/>
          <span class="right-side-sub-title">Send Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <div class="simple-panel">
      <div class="table">
        <div class="row">
          <div class="col-md-12">
            <h5 class="table-title">Send To T-Address</h5>
          </div>
        </div>
        <div class="row table-content">
          <div class="col-md-6 form-group" :class="{'has-error': hasErrors('recipient')}">
            <label>Recipient</label>
            <input v-model="recipient" class="form-control" placeholder="0x0000000000000000000000000000000000000000">
            <span class="help-block" v-if="hasErrors('recipient')">{{ getErrors('recipient') }}</span>
          </div>
          <div class="col-md-2 form-group" :class="{'has-error': hasErrors('amount')}">
            <label>Amount</label>
            <input v-model="amount" class="form-control" placeholder="0.0">
            <span class="help-block" v-if="hasErrors('amount')">{{ getErrors('amount') }}</span>
          </div>
          <div class="col-md-2 form-group" :class="{'has-error': hasErrors('gasPrice')}">
            <label>Gas Price</label>
            <input v-model="gasPrice" class="form-control">
            <span class="help-block" v-if="hasErrors('gasPrice')">{{ getErrors('gasPrice') }}</span>
          </div>
          <div class="col-md-2 form-group">
            <label>Fee</label>
            <input :value="fee" disabled class="form-control">
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 table-content-btn-block">
            <a href="#" id="table-content-btn-send" @click.prevent="send"> <img src="@/assets/images/send-icon.png"> Send </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Validator from 'validatorjs'
import {mapActions, mapMutations} from 'vuex'
import Balances from '../Layout/Balances'
import web3, {fromWei} from '../../../services/web3'
import pick from 'lodash-es/pick'

Validator.register('isAddress', value => web3.utils.isAddress(value), 'Recipient must be a valid address.')

export default {
  components: {
    Balances,
  },

  data () {
    return {
      recipient: '',
      amount: '',
      gasPrice: '21',
      errors: {},
    }
  },

  mounted () {
    web3.eth.getGasPrice((_, gas) => (this.gasPrice = gas / 1000000000))
  },

  computed: {
    fee () {
      return fromWei(this.gasPrice * 21001) * 1000000000
    },
  },

  methods: {
    ...mapActions({
      sendGly: 'sendGly',
      toast: 'addToastMessage',
    }),

    ...mapMutations({
      showUnlock: 'SHOW_UNLOCK',
    }),

    send () {
      if (! this.validate()) return

      this.sendGly(pick(this, ['recipient', 'amount', 'gasPrice']))
        .then(() => {
          this.recipient = ''
          this.amount = ''
        })
        .catch(err => {
          if (err.message.includes('authentication')) {
            this.toast({text: 'You need to unlock your accounts first!', type: 'danger'})
            this.showUnlock()
          } else throw err
        })
    },

    validate () {
      const validation = new Validator(pick(this, ['recipient', 'amount', 'gasPrice']), {
        recipient: 'required|isAddress',
        amount: 'required|numeric|min:0.00000000000001',
        gasPrice: 'required|min:1',
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
