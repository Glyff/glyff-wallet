<template>
  <div>
    <div class="row">
      <!-- Begin Logo Block -->
      <div id="logo-block">
        <img src="@/assets/images/glyff-logo.png" title="Glyff" />
      </div>
      <!-- End Logo Block -->
    </div>
    <div class="row">
      <!-- Begin Profile Info Block -->
      <div id="profile-info-block" class="container-fluid">
        <div class="profile-picture-block">
          <img src="@/assets/images/profile.png" title="Person Name" />
        </div>
        <div class="profile-name">
          <h4>Person Name</h4>
        </div>
      </div>
      <!-- End Profile Info Block -->
    </div>
    <div class="row" id="navigation-row">
      <!-- Begin Navigation Block -->
      <div id="navigation-block" class="container-fluid">
        <!-- Begin Navigation -->
        <ul id="navigation">
          <router-link tag="li" to="/"><a><img src="@/assets/images/overview-icon.png" title="Overview"> Overview</a></router-link>
          <router-link tag="li" to="/send"><a><img src="@/assets/images/send-icon.png" title="Send"> Send</a></router-link>
          <router-link tag="li" to="/receive"><a><img src="@/assets/images/receive-icon.png" title="Receive"> Receive</a></router-link>
          <router-link tag="li" to="/shield"><a><img src="@/assets/images/shield-icon.png" title="Shield"> Shield</a></router-link>
          <router-link tag="li" to="/settings"><a><img src="@/assets/images/settings-icon.png" title="Settings"> Settings</a></router-link>
        </ul>
        <!-- End Navigation -->
      </div>
      <!-- End Navigation Block -->
    </div>
  </div>
</template>
