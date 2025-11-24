<script setup>
import { ref } from 'vue'
import AppAuth from '@/components/pages/AppAuth.vue'
import AppHome from '@/components/pages/AppHome.vue'

const isAuthenticated = ref(false)
const currentUser = ref(null)

function handleLoginSuccess(user) {
    currentUser.value = user
    isAuthenticated.value = true
}

function handleLogout() {
    currentUser.value = null
    isAuthenticated.value = false
}
</script>

<template>
    <v-app>
        <AppAuth v-if="!isAuthenticated" @login-success="handleLoginSuccess" />
        <AppHome v-else :user="currentUser" @logout="handleLogout" />
    </v-app>
</template>

<style scoped></style>
