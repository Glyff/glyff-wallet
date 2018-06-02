<template>
  <div id="shield-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Shield<br />
          <span class="right-side-sub-title">Shield Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <div class="row table-content-top-navigation">
      <div class="col-md-12 table-content-top-btn-block">
        <a href="#"> <img src="@/assets/images/plus-icon.png">New Z-Address</a>
        <a href="#"> <img src="@/assets/images/chart-icon.png">Shield - Unshield</a>
        <a href="#"> <img src="@/assets/images/send-small-icon.png">Send</a>
        <a href="#"> <img src="@/assets/images/reset-icon.png">Reset</a>
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
import Balances from '../Layout/Balances'

export default {
  name: 'shield',

  components: {
    Balances,
  },
}
</script>
