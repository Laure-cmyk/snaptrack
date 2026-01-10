<script setup>
import TeapotIcon from '../assets/error-418-v2.svg';
</script>

<template>
  <v-container
    class="d-flex flex-column align-center justify-center text-center"
    style="min-height: 80vh; max-height: max-content; background-color: aquamarine"
  >
    <img :src="TeapotIcon" alt="Teapot" width="250" height="250" class="mb-8" />

    <h1 class="text-h4 mb-4">I'm a Teapot!</h1>

    <h2 class="text-h6 mb-6 text-medium-emphasis">Brewing error detected</h2>

    <p class="text-body-2 mb-8 text-medium-emphasis" style="max-width: 80%">
      The server refuses to brew coffee because it is, permanently, a teapot.
    </p>

    <v-btn variant="tonal" color="primary" size="small" to="/"> Go Back Home </v-btn>
  </v-container>
</template>

<style scoped></style>
