<script setup>
import { RouterView, RouterLink } from 'vue-router';
/* import PageFriendlist from './pages/PageFriendlist.vue'; */
</script>
<template>
  <v-app>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/createchallenge">Create</RouterLink>
    </nav>
    <RouterView />
  </v-app>
</template>
<style scoped></style>
