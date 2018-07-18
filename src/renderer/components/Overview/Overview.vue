<template>
  <div id="overview-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Overview<br />
          <span class="right-side-sub-title">Overview Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <div class="simple-panel">
      <table class="table">
        <thead>
        <tr>
          <th>Txtid</th>
          <th>Direction</th>
          <th>Amount</th>
          <th>Type</th>
          <th>Date</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="tx in transactionsPage">
          <td>{{ tx.hash }}</td>
          <td>{{ tx.direction }}</td>
          <td>{{ tx.amount | ether(tx.type.toLowerCase(), tx.type) }}</td>
          <td>{{ tx.type }}</td>
          <td>{{ tx.date.format('YYYY-MM-DD HH:mm') }}</td>
        </tr>
        <tr v-if="this.transactions.length === 0">
          <td colspan="5" class="text-center">No Transactions</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="row">
      <div id="pagination">
        <ul>
          <li><a href="#" @click.prevent="nextPage" :disabled="page === 1">Previous</a> </li>
          <li><a href="#" @click.prevent="prevPage" :disabled="page === totalPages">Next</a> </li>
          <li><a href="#" @click.prevent="showAll = ! showAll">All Transactions</a> </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import Balances from '../Layout/Balances'

export default {
  name: 'overview',

  components: {
    Balances,
  },

  data () {
    return {
      page: 1,
      pageSize: 20,
      showAll: false,
    }
  },

  computed: {
    ...mapGetters({
      account: 'accounts/currentAccount',
      transactions: 'accounts/currentAccountTransactions',
    }),

    totalPages () {
      let total = Math.ceil(this.transactions.length / this.pageSize)
      if (total === 0) total = 1
      return total
    },

    transactionsPage () {
      const sorted = this.transactions.slice().sort((a, b) => b - a)

      if (this.showAll) return sorted

      return sorted.slice(this.page - 1, this.page * this.pageSize - 1)
    },
  },

  methods: {

    nextPage () {
      if (this.page + 1 > this.totalPages) return
      this.page += 1
    },

    prevPage () {
      if (this.page - 1 < 1) return
      this.page -= 1
    },

  },
}
</script>
