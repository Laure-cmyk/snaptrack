<script setup>
import { ref } from 'vue';
import { useFetchJson } from '@/composables/useFetchJson';

const emit = defineEmits(['go-signup', 'login-success']);

const emailOrUsername = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const passwordField = ref(null)

function focusPassword() {
    passwordField.value?.focus()
}

async function login() {
  errorMessage.value = '';

  if (!emailOrUsername.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.'
    return
  }

  isLoading.value = true;

  try {
    // Call actual backend login endpoint
    const { data, error, execute } = useFetchJson({
      url: '/users/login',
      method: 'POST',
      data: {
        email: emailOrUsername.value,
        password: password.value
      },
      immediate: false
    });

    await execute();

    if (error.value) {
      errorMessage.value = error.value.data?.error || 'Email/nom d\'utilisateur ou mot de passe incorrect.';
      return;
    }

    // Save the JWT token
    localStorage.setItem('jwt', data.value.token);
    localStorage.setItem('user', JSON.stringify(data.value.user));

    emit('login-success', { emailOrUsername: emailOrUsername.value, user: data.value.user });
  } catch (err) {
    errorMessage.value = err.data?.error || err.message || 'Email ou mot de passe incorrect.';
    console.error('Login error:', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height pa-4 bg-white" fluid>
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="10" md="6" lg="4">
        <v-card elevation="0" class="pa-6 text-center">
          <!-- Logo Title -->
          <div class="mb-16 mt-0">
            <h1 class="text-h2 font-weight-bold" style="color: #1565c0">SnapTrack</h1>
          </div>

          <!-- Page Title -->
          <v-card-title class="text-h5 font-weight-bold text-left px-0 mb-6">
            Se connecter
          </v-card-title>

                    <!-- Email or Username Field -->
                    <v-text-field label="Email ou nom d'utilisateur" v-model="emailOrUsername" type="text"
                        variant="outlined" class="mb-4" density="comfortable" @keyup.enter="focusPassword" />

                    <!-- Password Field -->
                    <v-text-field ref="passwordField" label="Mot de passe" v-model="password"
                        :type="showPassword ? 'text' : 'password'" variant="outlined" class="mb-4" density="comfortable"
                        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showPassword = !showPassword" @keyup.enter="login" />

          <!-- Error Alert -->
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4 text-center">
            {{ errorMessage }}
          </v-alert>

          <!-- Login Button -->
          <v-card-actions class="px-0 pt-2">
            <v-btn
              block
              color="indigo-darken-1"
              size="x-large"
              rounded="lg"
              elevation="2"
              variant="flat"
              @click="login"
              :loading="isLoading"
              :disabled="isLoading"
            >
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

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
