<script setup>
import { RouterView, RouterLink } from 'vue-router';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import TheBottomNavigation from './components/TheBottomNavigation.vue';

const route = useRoute();

// Afficher la navigation seulement si on n'est pas sur la page d'auth
const showNavigation = computed(() => route.path !== '/authentification');
</script>

<template>

  <v-app>
<!--     <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/friendlist">Friends</RouterLink>
    </nav> -->
    <RouterView />
    <TheBottomNavigation v-if="showNavigation" />
  </v-app>
</template>

<style scoped></style>
