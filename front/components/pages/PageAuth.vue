<template>
  <v-container class="fill-height pa-0" fluid>
    <AuthOnboarding v-if="step === 'onboarding'" @continue="step = 'login'" />

    <AuthLogin v-if="step === 'login'" @go-signup="step = 'signup'" @login-success="goHome" />

    <AuthSignup v-if="step === 'signup'" @go-login="step = 'login'" @signup-success="handleSignupSuccess" />
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

import AuthOnboarding from '../auth/AuthOnboarding.vue'
import AuthLogin from '../auth/AuthLogin.vue'
import AuthSignup from '../auth/AuthSignup.vue'

const emit = defineEmits(['login-success'])

const step = ref('onboarding')

function handleSignupSuccess(user) {
  console.log('Compte créé:', user)
  // Rediriger vers la page de connexion
  step.value = 'login'
}

function goHome(user) {
  console.log('Utilisateur connecté:', user)
  // Émettre l'événement vers App.vue pour afficher AppHome
  emit('login-success', user)
}
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>