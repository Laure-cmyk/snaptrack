<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseHeader from '@/components/BaseHeader.vue'

const router = useRouter()
const route = useRoute()

const trail = ref(null)
const steps = ref([])
const loading = ref(true)
const error = ref(null)

// Fetch journey data from API
async function fetchJourney() {
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
        if (stepsRes.ok) {
            steps.value = await stepsRes.json()
        }
        
        // Map to our trail format
        trail.value = {
            id: journeyData._id,
            title: journeyData.name,
            description: journeyData.description,
            image: journeyData.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
            city: journeyData.town || '',
            rating: journeyData.averageRating || 0,
            locationsCount: steps.value.length
        }
    } catch (err) {
        console.error('Error fetching journey:', err)
        error.value = err.message
    } finally {
        loading.value = false
    }
}

onMounted(fetchJourney)

function goBack() {
    router.back()
}

function startPlay() {
    router.push({ name: 'challenge-play', params: { id: trail.value.id } })
}

function startLive() {
    router.push({ name: 'challenge-live', params: { id: trail.value.id } })
}
</script>

<template>
    <v-main class="bg-grey-lighten-4">
        <!-- Header -->
        <BaseHeader title="Détails du parcours" :show-back="true" @back="goBack" />

        <!-- Loading State -->
        <v-container v-if="loading" fluid class="d-flex justify-center align-center" style="min-height: 50vh;">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        </v-container>

        <!-- Error State -->
        <v-container v-else-if="error" fluid class="px-6 py-8 text-center">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <div class="text-h6 text-error mt-4">Erreur de chargement</div>
            <div class="text-body-2 text-grey">{{ error }}</div>
            <v-btn color="primary" class="mt-4" @click="fetchJourney()">Réessayer</v-btn>
        </v-container>

        <!-- Content -->
        <v-container v-else-if="trail" fluid class="px-6 pb-24 pt-6">
            <!-- Image du parcours -->
            <div class="mb-6">
                <v-img :src="trail.image" height="300" cover class="bg-grey-lighten-2" rounded="lg">
                    <div v-if="!trail.image" class="d-flex align-center justify-center fill-height">
                        <v-icon size="80" color="grey-lighten-1">mdi-image-outline</v-icon>
                    </div>
                </v-img>
            </div>

            <!-- Informations du parcours -->
            <div>
                <!-- Titre -->
                <h1 class="text-h6 font-weight-bold mb-3">{{ trail.title }}</h1>

                <!-- Ville et Note -->
                <div class="d-flex align-center ga-4 mb-6">
                    <!-- Ville -->
                    <div class="d-flex align-center text-body-2 text-grey-darken-1">
                        <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                        <span>{{ trail.city }}</span>
                    </div>

                    <!-- Note -->
                    <div class="d-flex align-center">
                        <v-icon color="yellow-darken-2" size="small" class="mr-1">mdi-star</v-icon>
                        <span class="text-body-2">{{ trail.rating.toFixed(1) }}</span>
                    </div>
                </div>

                <!-- Description -->
                <div class="mb-6">
                    <h2 class="text-subtitle-2 font-weight-bold mb-2">Description</h2>
                    <p class="text-body-2 text-grey-darken-2">{{ trail.description }}</p>
                </div>

                <!-- Nombre d'étapes -->
                <div class="text-body-2 mb-6">
                    <span class="font-weight-bold">Nombre d'étapes :</span> {{ trail.locationsCount }}
                </div>

                <!-- Boutons d'action -->
                <div class="d-flex flex-column ga-3">
                    <v-btn block size="x-large" color="indigo-darken-1" rounded="lg" elevation="2" variant="flat"
                        prepend-icon="mdi-play" @click="startPlay">
                        Faire le challenge
                    </v-btn>

                    <v-btn block size="x-large" color="indigo-darken-1" rounded="lg" variant="outlined"
                        prepend-icon="mdi-account-multiple" @click="startLive">
                        Joindre le live
                    </v-btn>
                </div>
            </div>
        </v-container>
    </v-main>
</template>

<style scoped>
.rating-badge {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 6px 12px;
}
</style>