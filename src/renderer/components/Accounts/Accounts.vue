<template>
  <div id="accounts-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Accounts<br/>
          <span class="right-side-sub-title">Accounts Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <new-account></new-account>
    <div class="simple-panel">
      <table class="table table-hover">
        <thead>
        <tr>
          <th>Name</th>
          <th>Address</th>
          <th>Balance</th>
          <th>Locked</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="account in accounts">
          <td>{{ account.name }}</td>
          <td>{{ account.address }}</td>
          <td>{{ account.balance | ether('gly', 'GLY') }}</td>
          <td>{{ account.locked ? 'Locked' : 'Unlocked' }}</td>
          <td class="text-right">
            <a href="#" class="btn btn-info btn-xs" @click.prevent="edit(account)"><i class="fa fa-pencil"></i></a>
            <a v-if="account.locked" href="#" class="btn btn-success btn-xs" @click.prevent="unlock(account)"><i class="fa fa-unlock"></i></a>
          </td>
        </tr>
        </tbody>
      </table>
      <unlock-account :account="selectedAccount" v-model="showUnlock"></unlock-account>
    </div>
  </div>
</template>

<script>
import Balances from '../Layout/Balances'
import UnlockAccount from './UnlockAccount'
import NewAccount from './NewAccount'
import {mapState, mapActions} from 'vuex'

export default {
  components: {
    Balances,
    NewAccount,
    UnlockAccount,
  },

  data () {
    return {
      showUnlock: false,
      selectedAccount: {},
    }
  },

  computed: {
    ...mapState({
      accounts: s => s.accounts.accounts,
    }),
  },

  methods: {

    ...mapActions({
      unlockAccount: 'accounts/unlock',
    }),

    edit (account) {
      //
    },

    unlock (account) {
      this.selectedAccount = account
      this.showUnlock = true
    },
  },
}
</script>
