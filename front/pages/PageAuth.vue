<template>
    <v-container class="fill-height pa-0" fluid>
        <AuthOnboarding v-if="step === 'onboarding'" @continue="step = 'login'" />

        <AuthLogin v-if="step === 'login'" @go-signup="step = 'signup'" @login-success="goHome" />

        <AuthSignup v-if="step === 'signup'" @go-login="step = 'login'" @signup-success="handleSignupSuccess" />
    </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthOnboarding from '../components/auth/AuthOnboarding.vue'
import AuthLogin from '../components/auth/AuthLogin.vue'
import AuthSignup from '../components/auth/AuthSignup.vue'

const router = useRouter()
const step = ref('onboarding')

function handleSignupSuccess(user) {
    console.log('Compte créé:', user)
    // Rediriger vers la page de connexion
    step.value = 'login'
}

function goHome(user) {
    console.log('Utilisateur connecté:', user)
    // Rediriger vers la page home
    router.push('/')
}
</script>

<style scoped>
.fill-height {
    height: 100vh;
}
</style>