<template>
  <div id="setting-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Settings<br />
          <span class="right-side-sub-title">Settings Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <div class="simple-panel">
      <div class="table">
        <div class="row table-content">
          <div class="col-md-6 form-group">
            <label>Shielded token contract address</label>
            <input class="form-control" v-model="address">
          </div>
          <div class="col-md-12 form-group">
            <label>Shielded token contract ABI</label>
            <textarea class="form-control" v-model="abi"></textarea>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 table-content-btn-block">
            <a href="#" @click.prevent="update()" class="mr-40">Update</a>
            <a href="#" @click.prevent="save()"><img src="@/assets/images/save-icon.png"> Save - Save As</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState, mapActions, mapMutations} from 'vuex'
import Balances from '../Layout/Balances'
import fs from 'fs-extra'
import {remote} from 'electron'

export default {
  components: {
    Balances,
  },

  data () {
    return {
      address: '',
      abi: '',
    }
  },

  beforeMount () {
    this.address = this.oToken.address
    this.abi = JSON.stringify(this.oToken.abi)
  },

  computed: {
    ...mapState({
      oToken: s => s.general.oToken,
    }),
  },

  methods: {
    ...mapActions({
      toast: 'addToastMessage',
    }),

    ...mapMutations({
      updateOToken: 'UPDADE_OTOKEN',
      setTokenContract: 'SET_TOKEN_CONTRACT',
    }),

    update () {
      if (! this.address || this.address.length !== 42) {
        return alert('Address must be a valid contract address')
      }

      try {
        const abi = JSON.parse(this.abi)

        this.updateOToken({address: this.address, abi})
        this.setTokenContract()
        this.toast({text: 'New oToken was saved'})
      } catch (e) {
        return alert('Abi must be a valid JSON')
      }
    },

    save () {
      remote.dialog.showSaveDialog({defaultPath: 'oToken.json'}, filename => {
        if (typeof filename === 'undefined') {
          return console.log('You didn\'t save the file')
        }

        fs.writeJsonSync(filename, this.oToken)
      })
    },
  },
}
</script>
