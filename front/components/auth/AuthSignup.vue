<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['go-login', 'signup-success'])

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errorMessage = ref('')

// États pour savoir si les champs ont été touchés
const usernameTouched = ref(false)
const emailTouched = ref(false)
const passwordTouched = ref(false)
const passwordConfirmTouched = ref(false)

// Validations individuelles
const usernameError = computed(() => {
    if (!usernameTouched.value) return ''
    if (!username.value) return 'Le nom d\'utilisateur est requis.'
    if (username.value.length < 3) return 'Le nom d\'utilisateur doit contenir au moins 3 caractères.'
    return ''
})

const emailError = computed(() => {
    if (!emailTouched.value) return ''
    if (!email.value) return 'L\'email est requis.'
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email.value)) return 'Format d\'email invalide.'
    return ''
})

const passwordError = computed(() => {
    if (!passwordTouched.value) return ''
    if (!password.value) return 'Le mot de passe est requis.'
    if (password.value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.'
    return ''
})

const passwordConfirmError = computed(() => {
    if (!passwordConfirmTouched.value) return ''
    if (!passwordConfirm.value) return 'La confirmation du mot de passe est requise.'
    if (password.value !== passwordConfirm.value) return 'Les mots de passe ne correspondent pas.'
    return ''
})

async function signup() {
    errorMessage.value = ''

    // Marquer tous les champs comme touchés
    usernameTouched.value = true
    emailTouched.value = true
    passwordTouched.value = true
    passwordConfirmTouched.value = true

    // Vérifier si tous les champs sont remplis
    if (!username.value || !email.value || !password.value || !passwordConfirm.value) {
        errorMessage.value = 'Veuillez remplir tous les champs.'
        return
    }

    // Vérifier s'il y a des erreurs de validation
    if (usernameError.value || emailError.value || passwordError.value || passwordConfirmError.value) {
        return
    }

    try {
        // Ici tu peux appeler ton backend avec useFetchJson
        // Exemple : await useFetchJson({ url: '/api/signup', method: 'POST', data: { username, email, password } })

        // Simulation réussite
        emit('signup-success', { username: username.value, email: email.value })
    } catch (err) {
        errorMessage.value = 'Erreur lors de la création du compte.'
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
                        class="mb-0" density="comfortable" :error="!!usernameError" @blur="usernameTouched = true" />
                    <div v-if="usernameError" class="text-error text-body-2 text-left mb-6" style="margin-top: -8px;">
                        {{ usernameError }}
                    </div>

                    <!-- Email Field -->
                    <v-text-field label="Email" v-model="email" type="email" variant="outlined" class="mb-0"
                        density="comfortable" :error="!!emailError" @blur="emailTouched = true" />
                    <div v-if="emailError" class="text-error text-body-2 text-left mb-6" style="margin-top: -8px;">
                        {{ emailError }}
                    </div>

                    <!-- Password Field -->
                    <v-text-field label="Mot de passe" v-model="password" type="password" variant="outlined"
                        class="mb-0" density="comfortable" :error="!!passwordError" @blur="passwordTouched = true" />
                    <div v-if="passwordError" class="text-error text-body-2 text-left mb-6" style="margin-top: -8px;">
                        {{ passwordError }}
                    </div>

                    <!-- Confirm Password Field -->
                    <v-text-field label="Confirmer le mot de passe" v-model="passwordConfirm" type="password"
                        variant="outlined" class="mb-0" density="comfortable" :error="!!passwordConfirmError"
                        @blur="passwordConfirmTouched = true" />
                    <div v-if="passwordConfirmError" class="text-error text-body-2 text-left mb-8"
                        style="margin-top: -8px;">
                        {{ passwordConfirmError }}
                    </div>

                    <!-- Error Alert -->
                    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4 text-left">
                        {{ errorMessage }}
                    </v-alert>

                    <!-- Signup Button -->
                    <v-card-actions class="px-0 pt-2">
                        <v-btn block color="indigo-darken-1" size="x-large" rounded="lg" elevation="2" variant="flat"
                            @click="signup">
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
