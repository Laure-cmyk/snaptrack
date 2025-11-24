<script setup>
import { ref } from 'vue'
import introImage from '@/assets/intro-onboarding-1.jpg'
import BaseModal from '@/components/BaseModal.vue'

const showLocationDialog = ref(false)
const showCameraDialog = ref(false)
const locationError = ref('')
const cameraError = ref('')
const emit = defineEmits(['continue'])

function openModal() {
    showLocationDialog.value = true
}

async function requestLocationPermission() {
    locationError.value = ''

    try {
        await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
        })

        showLocationDialog.value = false
        showCameraDialog.value = true
    } catch (err) {
        console.error(err)
        locationError.value = "Impossible d'accéder à la localisation. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
    }
}

function declineLocation() {
    showLocationDialog.value = false
    locationError.value = ''
    // Reste sur l'onboarding
}

async function requestCameraPermission() {
    cameraError.value = ''

    try {
        // Demander la permission caméra et arrêter le stream immédiatement
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())

        showCameraDialog.value = false
        emit('continue')
    } catch (err) {
        console.error(err)
        cameraError.value = "Impossible d'accéder à la caméra. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
    }
}

function declineCamera() {
    showCameraDialog.value = false
    cameraError.value = ''
    // Reste sur l'onboarding
}
</script>

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

                    <!-- Image -->
                    <v-img :src="introImage" height="380" cover class="rounded-lg mb-6"
                        alt="Découverte urbaine"></v-img>

                    <!-- Title -->
                    <v-card-title class="text-h5 font-weight-bold text-center px-0 mb-2">
                        Jeu de découverte
                    </v-card-title>

                    <!-- Description -->
                    <v-card-text class="text-body-1 text-center text-grey-darken-1 px-2 mb-6">
                        Découvrez de nouveaux lieux tout en jouant. Défiez vos amis !
                    </v-card-text>

                    <!-- Button -->
                    <v-card-actions class="px-0 pt-2">
                        <v-btn block color="indigo-darken-1" size="x-large" rounded="lg" elevation="2" variant="flat"
                            @click="openModal">
                            Continuer
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Modal Localisation -->
        <BaseModal v-model="showLocationDialog" title="Autoriser l'accès à la localisation" confirm-text="Autoriser"
            cancel-text="Décliner" @confirm="requestLocationPermission" @cancel="declineLocation">
            Votre navigateur doit permettre l'accès à la localisation pour pouvoir utiliser l'application.
            <v-alert v-if="locationError" type="error" variant="tonal" class="mt-4 text-center">
                <div class="text-center">{{ locationError }}</div>
            </v-alert>
        </BaseModal>

        <!-- Modal Caméra -->
        <BaseModal v-model="showCameraDialog" title="Autoriser l'accès à la caméra" confirm-text="Autoriser"
            cancel-text="Décliner" @confirm="requestCameraPermission" @cancel="declineCamera">
            Vous devez autoriser l'accès à la caméra pour pouvoir utiliser l'application.
            <v-alert v-if="cameraError" type="error" variant="tonal" class="mt-4 text-center">
                <div class="text-center">{{ cameraError }}</div>
            </v-alert>
        </BaseModal>
    </v-container>
</template>

<style scoped>
.fill-height {
    min-height: 100vh;
}
</style>
