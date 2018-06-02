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
          <div class="col-md-3 form-group">
            <label>From Account</label>
            <select class="form-control">
              <option>Select Account</option>
            </select>
          </div>
          <div class="col-md-2 form-group">
            <label>Recipient</label>
            <input class="form-control" />
          </div>
          <div class="col-md-2 form-group">
            <label>Amount</label>
            <input class="form-control" />
          </div>
          <div class="col-md-2 form-group">
            <label>Gas Price</label>
            <input class="form-control" />
          </div>
          <div class="col-md-2 form-group">
            <label>Fee</label>
            <input class="form-control" />
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 table-content-btn-block">
            <a href="#" id="table-content-btn-send"> <img src="@/assets/images/send-icon.png"> Send </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Balances from '../Layout/Balances'

export default {
  name: 'send',

  components: {
    Balances,
  },
}
</script>
