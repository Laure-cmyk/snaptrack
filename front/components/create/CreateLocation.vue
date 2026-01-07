<script setup>
import { ref, computed } from 'vue'
import { compressImage } from '@/utils/imageCompression'

// Props & Emits
const props = defineProps({
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    successMessage: { type: String, default: '' }
})

const emit = defineEmits(['save', 'cancel', 'error'])

//REFS (local state)
const valid = ref(false)
const photoInput = ref(null)
const loadingGPS = ref(false)
const permissionDialog = ref(false)
const permissionType = ref('') // 'camera' | 'gps'
const permissionMessage = ref('')

const localLocation = ref({
    id: Date.now(),
    title: '',
    description: '',
    image: null,
    coordinates: null
})

// Enables the save button only when all required data is present and valid.
const canSave = computed(() =>
    valid.value &&
    localLocation.value.description &&
    localLocation.value.image &&
    localLocation.value.coordinates
)

// Form Validation Rules
const rules = {
    required: value => !!value || 'Ce champ est requis'
}

// Camera permission
async function requestCameraPermission() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            triggerPhotoUpload()
            return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())

        triggerPhotoUpload()
    } catch (err) {
        console.error('Erreur permission caméra:', err)

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            permissionType.value = 'camera'
            permissionMessage.value = "L'accès à la caméra est nécessaire pour prendre une photo du lieu. Veuillez autoriser l'accès pour continuer."
            permissionDialog.value = true
        } else {
            triggerPhotoUpload()
        }
    }
}

function triggerPhotoUpload() {
    photoInput.value.click()
}

function retryPermission() {
    permissionDialog.value = false

    if (permissionType.value === 'camera') {
        requestCameraPermission()
    } else if (permissionType.value === 'gps') {
        getCurrentLocation()
    }
}

// Photo functions
async function handlePhotoUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
        const compressedImage = await compressImage(file, 800, 800, 0.7)
        localLocation.value.image = compressedImage
    } catch (err) {
        console.error('Erreur compression image:', err)
        emit('error', 'Erreur lors du traitement de l\'image')
    }
}

function removePhoto() {
    localLocation.value.image = null
}

// GPS functions
async function getCurrentLocation() {
    loadingGPS.value = true

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            })
        })

        localLocation.value.coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        }
    } catch (err) {
        console.error('Erreur GPS:', err)
        handleGPSError(err)
    } finally {
        loadingGPS.value = false
    }
}

function handleGPSError(err) {
    const errorMessages = {
        1: { // PERMISSION_DENIED
            type: 'gps',
            message: "L'accès à votre localisation est nécessaire pour enregistrer la position du lieu. Veuillez autoriser l'accès pour continuer.",
            showDialog: true
        },
        2: "Position indisponible. Vérifiez que votre GPS est activé.",
        3: "La demande de localisation a expiré. Réessayez."
    }

    const error = errorMessages[err.code] || "Impossible d'obtenir votre position."

    if (error.showDialog) {
        permissionType.value = error.type
        permissionMessage.value = error.message
        permissionDialog.value = true
    } else {
        emit('error', error)
    }
}
</script>

<template>
    <v-form ref="form" v-model="valid" class="pa-6 bg-grey-lighten-4">
        <!-- Photo Upload -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Photo du lieu</div>
        <div class="mb-6">
            <input ref="photoInput" type="file" accept="image/*" capture="environment" style="display: none"
                @change="handlePhotoUpload" />

            <!-- Photo Field -->
            <div v-if="!localLocation.image" class="photo-field bg-grey-lighten-3 d-flex align-center justify-center"
                @click="requestCameraPermission"
                style="cursor: pointer; min-height: 120px; border-radius: 8px; border: 1px solid #E0E0E0;">
                <div class="text-center">
                    <v-icon size="40" color="grey-darken-1">mdi-camera</v-icon>
                    <div class="text-body-2 text-grey-darken-1 mt-2">Prendre une photo</div>
                </div>
            </div>

            <!-- Preview with Delete -->
            <div v-else class="position-relative">
                <v-img :src="localLocation.image" height="250" cover style="border-radius: 8px;" />
                <v-btn icon size="small" class="position-absolute"
                    style="top: 12px; right: 12px; background-color: rgba(0, 0, 0, 0.5);" @click="removePhoto">
                    <v-icon color="white" size="small">mdi-close</v-icon>
                </v-btn>
            </div>
        </div>

        <!-- Location Description -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Énigme</div>
        <v-textarea v-model="localLocation.description" placeholder="Ajoutez une énigme pour trouver ce lieu"
            variant="outlined" rows="3" :rules="[rules.required]" class="mb-2" bg-color="grey-lighten-3" />

        <!-- Location Coordinates -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Localisation GPS</div>
        <v-btn block size="large" variant="outlined" color="indigo-darken-1" prepend-icon="mdi-crosshairs-gps"
            @click="getCurrentLocation" :loading="loadingGPS" class="mb-2">
            {{ localLocation.coordinates ? 'Localisation enregistrée' : 'Obtenir ma position' }}
        </v-btn>
        <div v-if="localLocation.coordinates" class="text-caption text-grey mb-6 d-flex align-center">
            <v-icon size="small" color="success" class="mr-1">mdi-check-circle</v-icon>
            Position: {{ localLocation.coordinates.lat.toFixed(6) }}, {{ localLocation.coordinates.lng.toFixed(6) }}
        </div>

        <!-- Error Alert -->
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-6">
            {{ errorMessage }}
        </v-alert>

        <!-- Success Alert -->
        <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-6">
            {{ successMessage }}
        </v-alert>

        <!-- Action Buttons -->
        <div class="d-flex flex-column ga-2 mt-12">
            <v-btn block color="indigo-darken-1" size="x-large" rounded="lg" elevation="2" variant="flat"
                :disabled="!canSave" :loading="loading" @click="$emit('save', { ...localLocation })">
                Ajouter ce lieu
            </v-btn>

            <v-btn block color="grey-darken-1" size="large" rounded="lg" variant="text" @click="$emit('cancel')">
                Annuler
            </v-btn>
        </div>

        <!-- Permission Modal -->
        <v-dialog v-model="permissionDialog" max-width="400" persistent>
            <v-card rounded="xl" class="pa-4">
                <v-card-title class="text-h6 font-weight-bold text-center pa-4">
                    <v-icon size="48" :color="permissionType === 'camera' ? 'indigo-darken-1' : 'orange-darken-1'"
                        class="mb-2">
                        {{ permissionType === 'camera' ? 'mdi-camera' : 'mdi-map-marker' }}
                    </v-icon>
                    <div>Autorisation nécessaire</div>
                </v-card-title>
                <v-card-text class="px-6 py-4 text-center">
                    <div class="text-body-1 mb-4">
                        {{ permissionMessage }}
                    </div>
                </v-card-text>
                <v-card-actions class="pa-4 pt-2 flex-column ga-3">
                    <v-btn block color="indigo-darken-1" size="large" rounded="lg" variant="flat"
                        @click="retryPermission">
                        Autoriser l'accès
                    </v-btn>
                    <v-btn block color="grey-darken-1" size="large" rounded="lg" variant="text"
                        @click="permissionDialog = false">
                        Annuler
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-form>
</template>

<style scoped></style>