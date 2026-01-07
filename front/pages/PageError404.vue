<script setup>
import ErrorIcon from '../assets/error-404.svg';
</script>

<template>
  <v-container
    class="d-flex flex-column align-center justify-center text-center"
    style="min-height: 80vh; max-height: max-content; background-color: tomato"
  >
    <img :src="ErrorIcon" alt="Teapot" width="250" height="250" class="mb-8" />

    <h1 class="text-h4 mb-4">Page not found</h1>

    <h2 class="text-h6 mb-6 text-medium-emphasis">☹️</h2>

    <p class="text-body-2 mb-8 text-medium-emphasis" style="max-width: 80%">
      This page doesn't exist.
    </p>

    <v-btn variant="tonal" color="primary" size="small" to="/"> Go Back Home </v-btn>
  </v-container>
</template>

<style scoped></style>
