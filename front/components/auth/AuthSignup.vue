<script setup>
import { ref } from 'vue'
import { useFetchJson } from '@/composables/useFetchJson'

const emit = defineEmits(['go-login', 'signup-success'])

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function signup() {
    errorMessage.value = ''

    if (!username.value || !email.value || !password.value || !passwordConfirm.value) {
        errorMessage.value = 'Veuillez remplir tous les champs.'
        return
    }
    if (password.value !== passwordConfirm.value) {
        errorMessage.value = 'Les mots de passe ne correspondent pas.'
        return
    }

    isLoading.value = true

    try {
        // Call actual backend signup endpoint
        const { data, error, execute } = useFetchJson({
            url: '/users',
            method: 'POST',
            data: {
                username: username.value,
                email: email.value,
                password: password.value
            },
            immediate: false
        })

        await execute()

        if (error.value) {
            errorMessage.value = error.value.data?.error || 'Erreur lors de la création du compte.'
            return
        }

        // Save the user info and redirect to login
        emit('signup-success', { username: username.value, email: email.value, user: data.value })
    } catch (err) {
        errorMessage.value = err.data?.error || err.message || 'Erreur lors de la création du compte.'
        console.error('Signup error:', err)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <v-container class="fill-height pa-4 bg-white" fluid>
        <v-row align="center" justify="center" class="fill-height">
            <v-col cols="12" sm="10" md="6" lg="4">
                <v-card elevation="0" class="pa-6 text-center">
                    <!-- Logo Title -->
                    <div class="mb-14 mt-4">
                        <h1 class="text-h2 font-weight-bold" style="color: #1565c0;">
                            SnapTrack
                        </h1>
                    </div>

                    <!-- Page Title -->
                    <v-card-title class="text-h5 font-weight-bold text-left px-0 mb-6">
                        Créer un compte
                    </v-card-title>

                    <!-- Username Field -->
                    <v-text-field label="Nom d'utilisateur" v-model="username" type="text" variant="outlined"
                        class="mb-4" density="comfortable" />

                    <!-- Email Field -->
                    <v-text-field label="Email" v-model="email" type="email" variant="outlined" class="mb-4"
                        density="comfortable" />

                    <!-- Password Field -->
                    <v-text-field label="Mot de passe" v-model="password" type="password" variant="outlined"
                        class="mb-4" density="comfortable" />

                    <!-- Confirm Password Field -->
                    <v-text-field label="Confirmer le mot de passe" v-model="passwordConfirm" type="password"
                        variant="outlined" class="mb-4" density="comfortable" />

                    <!-- Error Alert -->
                    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4 text-center">
                        {{ errorMessage }}
                    </v-alert>

                    <!-- Signup Button -->
                    <v-card-actions class="px-0 pt-2">
                        <v-btn block color="indigo-darken-1" size="x-large" rounded="lg" elevation="2" variant="flat"
                            @click="signup" :loading="isLoading" :disabled="isLoading">
                            Créer mon compte
                        </v-btn>
                    </v-card-actions>

                    <!-- Link to Login -->
                    <v-btn block variant="text" class="mt-2" @click="$emit('go-login')">
                        Déjà un compte ? Se connecter
                    </v-btn>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>


<style scoped>
.fill-height {
    min-height: 100vh;
}
</style>
