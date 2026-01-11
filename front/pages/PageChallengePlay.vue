<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { WSClientRoom } from 'wsmini/client'
import BaseHeader from '@/components/BaseHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseScoreDisplay from '@/components/BaseScoreDisplay.vue'
import ChallengeLocationCard from '@/components/challenge/ChallengeLocationCard.vue'
import { calculateDistance, getScoreFromDistance, formatDistance } from '@/utils/scoring.js'
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
const locationPermissionDialog = ref(false)
const completeDialog = ref(false)
const scoreImproved = ref(false)
const previousScore = ref(0)
const rating = ref(0)
const ratingSaving = ref(false)
const existingRatingLoaded = ref(false)

// Scoring
const locationScores = ref([])
const currentScore = ref(null)
const totalScore = computed(() => locationScores.value.reduce((sum, score) => sum + score.points, 0))
const currentUserPosition = ref(null)

// Get userId from stored user object
function getUserId() {
    const userData = localStorage.getItem('user')
    if (!userData) return null
    const user = JSON.parse(userData)
    return user?.id || user?._id || null
}

// Get username from stored user object
function getUsername() {
    const userData = localStorage.getItem('user')
    if (!userData) return 'Player'
    const user = JSON.parse(userData)
    return user?.username || 'Player'
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
                    value: Number(newRating)
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
        const username = getUsername()

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

    const username = getUsername()

    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            if (wsRoom.value) {
                wsRoom.value.sendCmd('location', {
                    username,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            }
        },
        (err) => {
            console.warn('Geolocation error:', err.message)
        },
        {
            enableHighAccuracy: false,
            maximumAge: 30000,
            timeout: 15000
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
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        locationPermissionDialog.value = true
        return
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude
            const userLon = position.coords.longitude
            currentUserPosition.value = { lat: userLat, lon: userLon }

            // Get target location from database
            const targetLocation = trail.value.locations[currentLocationIndex.value]
            const targetLat = targetLocation.latitude
            const targetLon = targetLocation.longitude

            // Calculate distance between user and target location
            const distance = calculateDistance(userLat, userLon, targetLat, targetLon)

            // Get score based on distance (includes "Hors zone" for > 10km)
            const scoreData = getScoreFromDistance(distance)

            // Store score and show success modal (even for 0 points)
            currentScore.value = {
                ...scoreData,
                distance: formatDistance(distance),
                distanceMeters: distance
            }

            // Store score for this location
            locationScores.value.push({
                locationIndex: currentLocationIndex.value,
                points: scoreData.points,
                distance: distance
            })

            // Show success dialog with points (0 points if Hors zone)
            successDialog.value = true
        },
        (err) => {
            console.error('Geolocation error:', err)
            // Permission denied (code 1) or unavailable - show permission dialog
            if (err.code === 1) {
                locationPermissionDialog.value = true
            } else {
                // Other errors (timeout, position unavailable)
                errorDialog.value = true
            }
        },
        {
            enableHighAccuracy: false,
            maximumAge: 10000,
            timeout: 15000
        }
    )
}

function continueToNext() {
    successDialog.value = false
    if (currentLocationIndex.value < trail.value.locations.length - 1) {
        currentLocationIndex.value++
        currentScore.value = null
    } else {
        // Challenge terminé
        completeDialog.value = true
    }
}

function quitChallenge() {
    quitDialog.value = false
    router.back()
}

function completeChallenge() {
    // Save total score to database
    const userId = getUserId()
    const journeyId = route.params.id

    if (userId && journeyId) {
        fetch('/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                journeyId,
                score: totalScore.value
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.improved) {
                    scoreImproved.value = true
                    previousScore.value = data.previousScore || 0
                }
            })
            .catch(err => {
                console.error('Error saving score:', err)
            })
    }

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

        <!-- Location Permission Dialog -->
        <BaseModal v-model="locationPermissionDialog" title="Accès à la localisation requis" confirm-text="Compris"
            :cancel-text="''" confirm-color="indigo-darken-1" @confirm="locationPermissionDialog = false">
            <div class="text-center">
                <v-icon size="64" color="warning" class="mb-4">mdi-map-marker-alert</v-icon>
                <p class="text-body-2">
                    Pour jouer au challenge, vous devez autoriser l'accès à votre localisation dans les paramètres de
                    votre
                    navigateur.
                </p>
            </div>
        </BaseModal>

        <!-- Success Dialog -->
        <BaseModal v-model="successDialog" title="" confirm-text="Continuer" :cancel-text="''"
            confirm-color="indigo-darken-1" @confirm="continueToNext">
            <div class="text-center" v-if="currentScore">
                <!-- Niveau -->
                <h3 class="text-h5 font-weight-bold mb-1">{{ currentScore.level }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-4">{{ currentScore.description }}</p>

                <!-- Points gagnés -->
                <div class="my-4">
                    <BaseScoreDisplay :score="currentScore.points" label="Points gagnés" size="medium"
                        description="sur 100 points possibles" />
                </div>

                <!-- Distance -->
                <p class="text-body-2 text-grey-darken-1">
                    Distance : <span class="font-weight-bold">{{ currentScore.distance }}</span>
                </p>
            </div>
        </BaseModal>

        <!-- Complete Challenge Dialog -->
        <BaseModal v-model="completeDialog" title="Challenge terminé !" confirm-text="Terminer" :cancel-text="''"
            confirm-color="indigo-darken-1" @confirm="completeChallenge">
            <div class="text-center">
                <!-- Score total -->
                <div class="my-4">
                    <BaseScoreDisplay :score="totalScore" label="Score total" size="medium" />
                </div>

                <!-- Message d'amélioration -->
                <div v-if="scoreImproved" class="mb-4 pa-3 bg-green-lighten-5 rounded-lg">
                    <v-icon color="green-darken-2" class="mb-1">mdi-trophy</v-icon>
                    <p class="text-subtitle-2 font-weight-bold text-green-darken-2 mb-1">Nouveau record !</p>
                    <p class="text-caption text-grey-darken-1">Précédent : {{ previousScore }} pts</p>
                </div>

                <!-- Rating -->
                <div class="mt-6">
                    <p class="text-subtitle-2 font-weight-bold mb-3">Notez ce parcours :</p>
                    <div class="d-flex justify-center ga-1">
                        <v-rating :model-value="rating" @update:model-value="onRatingChange" color="yellow-darken-2"
                            active-color="yellow-darken-2" size="large" hover density="compact"
                            :disabled="ratingSaving" />
                    </div>
                </div>
            </div>
        </BaseModal>
    </v-main>
</template>

<style scoped></style>
