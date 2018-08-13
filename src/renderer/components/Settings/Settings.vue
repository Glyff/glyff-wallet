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
            <a href="#" id="table-content-btn-save" @click.prevent="save()"><img src="@/assets/images/save-icon.png"> Save - Save As </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex'
import Balances from '../Layout/Balances'
import fs from 'fs-extra'
const {dialog} = require('electron').remote

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
    save () {
      dialog.showSaveDialog({defaultPath: 'oToken.json'}, filename => {
        if (typeof filename === 'undefined') {
          return console.log('You didn\'t save the file')
        }

        fs.writeJsonSync(filename, this.oToken)
      })
    },
  },
}
</script>
