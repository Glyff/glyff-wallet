<template>
  <div id="receive-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Receive<br/>
          <span class="right-side-sub-title">Receive Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <div class="row table-content-top-navigation">
      <div class="col-md-12 table-content-top-btn-block">
        <a href="#" v-if="currentAccount && currentAccount.locked" @click.prevent="showUnlock()"><img src="@/assets/images/unlock-icon.png">Unlock</a>
        <a href="#" @click.prevent="showNewAccount()"><img src="@/assets/images/plus-icon.png">New T-Address</a>
      </div>
    </div>
    <div class="simple-panel">
      <div class="table">
        <div class="row table-content">
          <div class="col-md-6 form-group">
            <label>Balance</label>
            <input class="form-control" />
          </div>
          <div class="col-md-6 form-group">
            <label>Address</label>
            <input class="form-control" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters, mapMutations} from 'vuex'
import Balances from '../Layout/Balances'

export default {
  components: {
    Balances,
  },

  computed: {
    ...mapGetters({
      currentAccount: 'currentAccount',
    }),

  },

  methods: {
    ...mapMutations({
      showUnlock: 'SHOW_UNLOCK',
      showNewAccount: 'SHOW_NEW_ACCOUNT',
    }),

  },
}
</script>
