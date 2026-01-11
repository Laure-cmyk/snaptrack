<script setup>
import { ref } from 'vue';
import introImage from '@/assets/image_introduction.jpg';
import BaseModal from '@/components/BaseModal.vue';

const showLocationDialog = ref(false);
const showCameraDialog = ref(false);
const locationError = ref('');
const cameraError = ref('');
const emit = defineEmits(['continue']);

function openModal() {
  showLocationDialog.value = true;
}

async function requestLocationPermission() {
  locationError.value = '';

    try {
        await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            })
        })

        showLocationDialog.value = false
        showCameraDialog.value = true
    } catch (err) {
        console.error(err)
        locationError.value = "error"
    }
}

function declineLocation() {
  showLocationDialog.value = false;
  locationError.value = '';
  // Reste sur l'onboarding
}

async function requestCameraPermission() {
  cameraError.value = '';

  try {
    // Demander la permission caméra et arrêter le stream immédiatement
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());

    showCameraDialog.value = false;
    emit('continue');
  } catch (err) {
    console.error(err);
    cameraError.value =
      "Impossible d'accéder à la caméra. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
  }
}

function declineCamera() {
  showCameraDialog.value = false;
  cameraError.value = '';
  // Reste sur l'onboarding
}
</script>

<template>
  <v-container class="fill-height pa-0 position-relative" fluid>
    <!-- Image de fond plein écran -->
    <v-img :src="introImage" cover class="full-screen-image" alt="Introduction SnapTrack"></v-img>

    <!-- Carte de contenu par-dessus -->
    <div class="content-card">
      <v-card elevation="8" class="pa-8 text-center">
        <!-- Title -->
        <v-card-title class="text-h5 font-weight-bold text-center px-0 mb-3 title-wrap">
          Une photo, un lieu à trouver
        </v-card-title>

        <!-- Description -->
        <v-card-text class="text-body-1 text-center text-grey-darken-1 px-2 mb-8">
          Explore des parcours photos et mets ton sens de l'observation à l'épreuve. Sauras-tu
          retrouver les lieux cachés autour de toi ?
        </v-card-text>

        <!-- Button -->
        <v-card-actions class="px-0 pt-2">
          <v-btn
            block
            color="indigo-darken-1"
            size="x-large"
            rounded="lg"
            elevation="2"
            variant="flat"
            @click="openModal"
          >
            Continuer
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

        <!-- Modal Localisation -->
        <BaseModal v-model="showLocationDialog" title="Autoriser l'accès à la localisation" confirm-text="Autoriser"
            cancel-text="Décliner" @confirm="requestLocationPermission" @cancel="declineLocation">
            <p class="text-body-1 mb-4">
                SnapTrack utilise ta position pour vérifier que tu es au bon endroit lors de la découverte des lieux.
            </p>

            <!-- Message d'erreur -->
            <v-alert v-if="locationError" type="error" variant="tonal" class="mb-4 text-left">
                <div class="text-body-2">
                    La localisation n'est pas activée sur votre appareil. Veuillez l'activer dans les paramètres puis
                    réessayer.
                </div>
            </v-alert>
        </BaseModal>

        <!-- Modal Caméra -->
        <BaseModal v-model="showCameraDialog" title="Autoriser l'accès à la caméra" confirm-text="Autoriser"
            cancel-text="Décliner" @confirm="requestCameraPermission" @cancel="declineCamera">
            Vous devez autoriser l'accès à la caméra pour pouvoir utiliser l'application.
            <v-alert v-if="cameraError" type="error" variant="tonal" class="mt-4 text-left">
                {{ cameraError }}
            </v-alert>
        </BaseModal>
    </v-container>
</template>

<style scoped>
.fill-height {
  min-height: 100vh;
  position: relative;
}

.full-screen-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.content-card {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 0;
  height: 40%;
}

.content-card .v-card {
  background-color: white;
  border-radius: 32px 32px 0 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title-wrap {
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.3;
}
</style>
