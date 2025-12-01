<script setup>
import { ref } from 'vue'
import PageAuth from '@/components/pages/PageAuth.vue'
import PageHome from '@/components/pages/PageHome.vue'

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
        <PageAuth v-if="!isAuthenticated" @login-success="handleLoginSuccess" />
        <PageHome v-else :user="currentUser" @logout="handleLogout" />
    </v-app>
</template>

<style scoped></style>
