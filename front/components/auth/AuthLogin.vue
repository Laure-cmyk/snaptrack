<template>
    <v-container class="fill-height pa-4 bg-white" fluid>
        <v-row align="center" justify="center" class="fill-height">
            <v-col cols="12" sm="10" md="6" lg="4">
                <v-card elevation="0" class="pa-6 text-center">
                    <!-- Logo Title -->
                    <div class="mb-8 mt-4">
                        <h1 class="text-h3 font-weight-bold" style="color: black;">
                            SnapTrack
                        </h1>
                    </div>

                    <!-- Page Title -->
                    <v-card-title class="text-h5 font-weight-bold text-center px-0 mb-6">
                        Se connecter
                    </v-card-title>

                    <!-- Email Field -->
                    <v-text-field label="Email" v-model="email" type="email" variant="outlined" class="mb-4"
                        density="comfortable" />

                    <!-- Password Field -->
                    <v-text-field label="Mot de passe" v-model="password" type="password" variant="outlined"
                        class="mb-4" density="comfortable" />

                    <!-- Error Alert -->
                    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4 text-center">
                        <div class="text-center">{{ errorMessage }}</div>
                    </v-alert>

                    <!-- Login Button -->
                    <v-card-actions class="px-0 pt-2">
                        <v-btn block color="indigo-darken-1" size="x-large" rounded="lg" elevation="2" variant="flat"
                            @click="login">
                            Se connecter
                        </v-btn>
                    </v-card-actions>

                    <!-- Link to Signup -->
                    <v-btn block variant="text" class="mt-2" @click="$emit('go-signup')">
                        Créer un compte
                    </v-btn>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useFetchJson } from '@/composables/useFetchJson'

const emit = defineEmits(['go-signup', 'login-success'])

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function login() {
    errorMessage.value = ''

    // Simuler appel API
    if (!email.value || !password.value) {
        errorMessage.value = 'Veuillez remplir tous les champs.'
        return
    }

    try {
        // Ici tu peux appeler ton backend avec useFetchJson
        // Exemple : await useFetchJson({ url: '/api/login', method: 'POST', data: { email, password } })

        // Simulation réussite
        emit('login-success', { email: email.value })
    } catch (err) {
        errorMessage.value = 'Email ou mot de passe incorrect.'
    }
}
</script>

<style scoped>
.fill-height {
    min-height: 100vh;
}
</style>
