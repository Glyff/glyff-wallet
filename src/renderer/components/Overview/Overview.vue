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
        <tr>
          <td>0xde0B295669a9fd93d5F28D9Ec85E40f4cb69</td>
          <td>direction text example</td>
          <td>USD$ 12,876</td>
          <td>Type text example</td>
          <td>27.04.2018 12:30</td>
        </tr>
        <tr>
          <td>0xde0B295669a9fd93d5F28D9Ec85E40f4cb69</td>
          <td>direction text example</td>
          <td>USD$ 12,876</td>
          <td>Type text example</td>
          <td>27.04.2018 12:30</td>
        </tr>
        <tr>
          <td>0xde0B295669a9fd93d5F28D9Ec85E40f4cb69</td>
          <td>direction text example</td>
          <td class="negative-amount">USD$ 12,876</td>
          <td>Type text example</td>
          <td>27.04.2018 12:30</td>
        </tr>
        <tr>
          <td>0xde0B295669a9fd93d5F28D9Ec85E40f4cb69</td>
          <td>direction text example</td>
          <td>USD$ 12,876</td>
          <td>Type text example</td>
          <td>27.04.2018 12:30</td>
        </tr>
        <tr>
          <td>0xde0B295669a9fd93d5F28D9Ec85E40f4cb69</td>
          <td>direction text example</td>
          <td>USD$ 12,876</td>
          <td>Type text example</td>
          <td>27.04.2018 12:30</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="row">
      <div id="pagination">
        <ul>
          <li><a href="#">Previous</a> </li>
          <li> <a href="#">Next</a> </li>
          <li> <a href="#">All Transactions</a> </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Balances from '../Layout/Balances'

export default {
  name: 'overview',

  components: {
    Balances,
  },

  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    }
  }
}
</script>
