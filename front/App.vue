<script setup>
import { RouterView, RouterLink } from 'vue-router';
</script>
<template>
  <v-app>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/socials">Friends</RouterLink>
      <RouterLink to="/createchallenge">Create</RouterLink>
    </nav>
    <RouterView />
  </v-app>
</template>
<style scoped></style>
