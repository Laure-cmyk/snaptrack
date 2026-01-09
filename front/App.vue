<script setup>
import { RouterView, RouterLink } from 'vue-router';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import TheBottomNavigation from './components/TheBottomNavigation.vue';

const route = useRoute();

// Afficher la navigation seulement si on n'est pas sur certaines pages
const showNavigation = computed(() => {
  const hiddenPaths = ['/authentification']
  const hiddenPathPatterns = ['/trail/', '/challenge/']

  return !hiddenPaths.includes(route.path) &&
    !hiddenPathPatterns.some(pattern => route.path.includes(pattern))
});
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
