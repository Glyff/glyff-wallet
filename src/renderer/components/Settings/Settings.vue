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
            <input class="form-control" />
          </div>
          <div class="col-md-12 form-group">
            <label>Shielded token contract ABI</label>
            <textarea class="form-control"></textarea>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 table-content-btn-block">
            <a href="#" id="table-content-btn-save"> <img src="@/assets/images/save-icon.png" /> Save - Save As </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Balances from '../Layout/Balances'

export default {
  name: 'settings',

  components: {
    Balances,
  },
}
</script>
