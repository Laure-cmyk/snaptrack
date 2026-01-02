<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeader from '@/components/BaseHeader.vue'

const router = useRouter()

// TODO: Récupérer les données du parcours depuis l'API ou le store
// Pour l'instant, données de démonstration
const trail = ref({
    id: 1,
    title: 'Parcours des Toilettes',
    description: '1000 lieux à découvrir dans toute la ville. Explorez les endroits les plus insolites et amusants de Yverdon-les-Bains.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    city: 'Yverdon-les-Bains',
    rating: 4.0,
    locationsCount: 10
})

function goBack() {
    router.back()
}

function startPlay() {
    router.push({ name: 'challenge-play', params: { id: trail.value.id } })
}

function startLive() {
    // TODO: Naviguer vers PageChallengeLive
    router.push({ name: 'challenge-live', params: { id: trail.value.id } })
}
</script>

<template>
    <v-main class="bg-grey-lighten-4">
        <!-- Header -->
        <BaseHeader title="Détails du parcours" :show-back="true" @back="goBack" />

        <!-- Content -->
        <v-container fluid class="px-6 pb-24 pt-6">
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