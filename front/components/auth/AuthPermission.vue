<template>
  <div class="permissions">
    <h1>Permissions nécessaires</h1>

    <p>
      Pour utiliser SnapTrack, nous avons besoin d’accéder à la caméra
      et à ta localisation. Ces permissions sont nécessaires pour
      capturer des lieux et vérifier les positions.
    </p>

    <v-alert
      type="error"
      v-if="errorMessage"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-btn color="primary" block @click="requestPermissions">
      Continuer
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const errorMessage = ref('')

async function requestPermissions() {
  errorMessage.value = ''

  try {
    // 1. Permission caméra
    await navigator.mediaDevices.getUserMedia({ video: true })

    // 2. Permission localisation
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    // Si tout est ok
    emit('permissions-granted')
  } catch (err) {
    errorMessage.value = "Impossible d'obtenir les permissions. Vérifie les réglages."
  }
}

const emit = defineEmits(['permissions-granted'])
</script>

<style scoped>
.permissions {
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 1.6rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #666;
}
</style>