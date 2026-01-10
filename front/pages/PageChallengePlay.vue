<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { WSClientRoom } from 'wsmini/client'
import BaseHeader from '@/components/BaseHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import ChallengeLocationCard from '@/components/challenge/ChallengeLocationCard.vue'
import successImage from '@/assets/success.png'
import failImage from '@/assets/fail.png'
import victoryImage from '@/assets/victory.png'

const router = useRouter()
const route = useRoute()

// État
const currentLocationIndex = ref(0)
const quitDialog = ref(false)
const successDialog = ref(false)
const errorDialog = ref(false)
const completeDialog = ref(false)
const rating = ref(0)
const ratingSaving = ref(false)
const existingRatingLoaded = ref(false)

// Get userId from stored user object
function getUserId() {
    const userData = localStorage.getItem('user')
    if (!userData) return null
    const user = JSON.parse(userData)
    return user?.id || user?._id || null
}

// Fetch user's existing rating for this journey
async function fetchUserRating() {
    try {
        const userId = getUserId()
        const journeyId = route.params.id
        
        if (!userId || !journeyId) return
        
        const response = await fetch(`/ratings?journeyId=${journeyId}&userId=${userId}`)
        if (response.ok) {
            const ratings = await response.json()
            if (ratings.length > 0) {
                rating.value = ratings[0].rating
            }
        }
        existingRatingLoaded.value = true
    } catch (err) {
        console.error('Failed to fetch existing rating:', err)
        existingRatingLoaded.value = true
    }
}

// Save rating to database
async function saveRating(newRating) {
    if (newRating > 0 && !ratingSaving.value) {
        ratingSaving.value = true
        try {
            const userId = getUserId()
            const journeyId = route.params.id
            
            const response = await fetch('/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    journeyId,
                    rating: Number(newRating)
                })
            })
            
            if (!response.ok) {
                throw new Error('Failed to save rating')
            }
        } catch (err) {
            // Rating save failed silently
        } finally {
            ratingSaving.value = false
        }
    }
}

// Handle rating click - directly save when user clicks stars
function onRatingChange(newRating) {
    rating.value = newRating
    if (newRating > 0) {
        saveRating(newRating)
    }
}

const loading = ref(true)
const error = ref(null)

// WebSocket for live location sharing
const wsRoom = ref(null)
let locationWatchId = null

// Trail data from API
const trail = ref({
    id: null,
    title: '',
    locations: []
})

// Websocket 
const room = ref(null)
let locationInterval = null

// Fetch journey and steps from API
async function fetchChallengeData() {
    loading.value = true
    error.value = null
    
    try {
        const journeyId = route.params.id
        
        // Fetch journey details
        const journeyRes = await fetch(`/journeys/${journeyId}`)
        if (!journeyRes.ok) {
            throw new Error(`Journey not found (${journeyRes.status})`)
        }
        const journeyData = await journeyRes.json()
        
        // Fetch steps for this journey
        const stepsRes = await fetch(`/steps/journey/${journeyId}`)
        if (!stepsRes.ok) {
            throw new Error(`Steps not found (${stepsRes.status})`)
        }
        const stepsData = await stepsRes.json()
        
        // Map to our trail format
        trail.value = {
            id: journeyData._id,
            title: journeyData.name,
            locations: stepsData.map(step => ({
                id: step.id,
                title: step.riddle || 'Énigme',
                description: step.riddle || 'Trouvez cet endroit !',
                image: step.image || 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80',
                latitude: step.latitude,
                longitude: step.longitude
            }))
        }
    } catch (err) {
        console.error('Error fetching challenge data:', err)
        error.value = err.message
    } finally {
        loading.value = false
    }
}

// Connect to WebSocket and start sharing location
async function connectWebSocket() {
    try {
        const journeyId = route.params.id
        const username = localStorage.getItem('username') || 'Player'
        
        // WebSocket URL - auto-detect based on current hostname
        const isProduction = window.location.hostname !== 'localhost'
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = isProduction 
            ? `${wsProtocol}//${window.location.host}`
            : (import.meta.env.VITE_WS_URL || 'ws://localhost:3000')
        
        const ws = new WSClientRoom(wsUrl)
        await ws.connect()
        
        wsRoom.value = await ws.roomCreateOrJoin(`journey-${journeyId}`, { username })
        
        // Start watching and emitting location
        startLocationSharing()
    } catch (err) {
        console.error('WebSocket connection failed:', err)
    }
}

// Watch GPS and emit location to live viewers
function startLocationSharing() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not supported')
        return
    }
    
    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            if (wsRoom.value) {
                wsRoom.value.cmd('location', {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            }
        },
        (err) => {
            console.warn('Geolocation error:', err.message)
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    )
}

// Stop location sharing
function stopLocationSharing() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
        locationWatchId = null
    }
    if (wsRoom.value) {
        wsRoom.value.leave()
        wsRoom.value = null
    }
}

onMounted(() => {
    fetchChallengeData()
    connectWebSocket()
    fetchUserRating()
})

onBeforeUnmount(() => {
    stopLocationSharing()
})

// Fonctions
function goBack() {
    quitDialog.value = true
}

function addLocation() {
    // TODO: Vérifier la localisation GPS réelle
    // Pour l'instant, simulation avec 80% de réussite
    const isLocationCorrect = Math.random() > 0.2

    if (isLocationCorrect) {
        successDialog.value = true

        setTimeout(() => {
            successDialog.value = false
            if (currentLocationIndex.value < trail.value.locations.length - 1) {
                currentLocationIndex.value++
            } else {
                // Challenge terminé
                completeDialog.value = true
            }
        }, 2000)
    } else {
        errorDialog.value = true
    }
}

function quitChallenge() {
    quitDialog.value = false
    router.back()
}

function completeChallenge() {
    // Rating is saved automatically via watch when user clicks stars
    completeDialog.value = false
    router.push('/')
}

function goToLive() {
    router.push({ name: 'challenge-live', params: { id: route.params.id } })
}
</script>

<template>
    <v-main class="bg-grey-lighten-4">
        <!-- Header -->
        <BaseHeader title="Challenge" :show-back="true" :show-actions="true" @back="goBack">
            <template #actions>
                <v-btn icon variant="text" @click="goToLive" title="Voir les joueurs en direct">
                    <v-icon color="white">mdi-map-marker-multiple</v-icon>
                </v-btn>
            </template>
        </BaseHeader>

        <!-- Loading State -->
        <v-container v-if="loading" fluid class="d-flex justify-center align-center" style="min-height: 50vh;">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        </v-container>

        <!-- Error State -->
        <v-container v-else-if="error" fluid class="px-6 py-8 text-center">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <div class="text-h6 text-error mt-4">Erreur de chargement</div>
            <div class="text-body-2 text-grey">{{ error }}</div>
            <v-btn color="primary" class="mt-4" @click="fetchChallengeData()">Réessayer</v-btn>
        </v-container>

        <!-- No locations -->
        <v-container v-else-if="trail.locations.length === 0" fluid class="px-6 py-8 text-center">
            <v-icon size="64" color="grey">mdi-map-marker-off</v-icon>
            <div class="text-h6 text-grey mt-4">Aucune étape</div>
            <div class="text-body-2 text-grey">Ce parcours n'a pas encore d'étapes.</div>
            <v-btn color="primary" class="mt-4" @click="router.back()">Retour</v-btn>
        </v-container>

        <!-- Content -->
        <v-container v-else fluid class="px-6 py-8 pb-24">
            <!-- Location Card -->
            <ChallengeLocationCard v-if="currentLocationIndex < trail.locations.length"
                :location="trail.locations[currentLocationIndex]" :current-index="currentLocationIndex"
                :total-locations="trail.locations.length" @add-location="addLocation" @quit="quitDialog = true" />

            <!-- Message si tous les lieux sont complétés -->
            <v-card v-else rounded="lg" elevation="2" class="pa-6 text-center">
                <v-icon size="80" color="green">mdi-check-circle</v-icon>
                <h2 class="text-h5 font-weight-bold mt-4 mb-2">Félicitations !</h2>
                <p class="text-body-1">Vous avez complété tous les lieux du parcours.</p>
            </v-card>
        </v-container>

        <!-- Quit Confirmation Dialog -->
        <BaseModal v-model="quitDialog" title="Quitter le challenge ?" confirm-text="Quitter" cancel-text="Annuler"
            confirm-color="red-darken-1" @confirm="quitChallenge" @cancel="quitDialog = false">
            Êtes-vous sûr de vouloir quitter ? Votre progression ne sera pas sauvegardée.
        </BaseModal>

        <!-- Success Dialog -->
        <BaseModal v-model="successDialog" title="Bravo !" :cancel-text="''" :confirm-text="''">
            <div class="text-center">
                <img :src="successImage" alt="Success" style="width: 120px; height: auto; margin: 0 auto;" />
                <h3 class="text-h6 font-weight-bold mt-4 mb-2">Félicitations !</h3>
                <p class="text-body-2">Vous avez trouvé le lieu correct ! L'énigme a été résolue avec succès.</p>
            </div>
        </BaseModal>

        <!-- Error Dialog -->
        <BaseModal v-model="errorDialog" title="Oups !" confirm-text="Réessayer" :cancel-text="''"
            confirm-color="indigo-darken-1" @confirm="errorDialog = false">
            <div class="text-center">
                <img :src="failImage" alt="Fail" style="width: 120px; height: auto; margin: 0 auto;" />
                <h3 class="text-h6 font-weight-bold mt-4 mb-2">Localisation incorrecte</h3>
                <p class="text-body-2">Vous n'êtes pas au bon endroit. Relisez l'énigme et déplacez-vous vers le lieu
                    correct.</p>
            </div>
        </BaseModal>

        <!-- Complete Challenge Dialog -->
        <BaseModal v-model="completeDialog" title="Challenge terminé !" confirm-text="Retour à l'accueil"
            :cancel-text="''" confirm-color="indigo-darken-1" @confirm="completeChallenge">
            <div class="text-center">
                <img :src="victoryImage" alt="Victory" style="width: 120px; height: auto; margin: 0 auto;" />
                <h3 class="text-h6 font-weight-bold mt-4 mb-3">Félicitations !</h3>
                <p class="text-body-2 mb-4">Vous avez terminé le parcours avec succès ! Tous les lieux ont été
                    découverts.
                </p>

                <!-- Rating -->
                <div class="mt-6">
                    <p class="text-subtitle-2 font-weight-bold mb-3">Notez ce parcours :</p>
                    <v-rating :model-value="rating" @update:model-value="onRatingChange" color="yellow-darken-2" active-color="yellow-darken-2" size="large" hover :disabled="ratingSaving" />
                </div>
            </div>
        </BaseModal>
    </v-main>
</template>

<style scoped></style>
