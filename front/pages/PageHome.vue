<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import TheSearchBar from '@/components/TheSearchBar.vue'

const searchQuery = ref('')
const journeys = ref([])
const loading = ref(true)
const error = ref(null)

// Fetch journeys from backend
async function fetchJourneys() {
    loading.value = true
    error.value = null
    
    try {
        const res = await fetch('/journeys')
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`)
        }
        
        const data = await res.json()
        journeys.value = data.journeys || []
    } catch (err) {
        console.error('Error fetching journeys:', err)
        error.value = err.message
    } finally {
        loading.value = false
    }
}

// Fetch on mount and when navigating back to this page
onMounted(fetchJourneys)
onActivated(fetchJourneys)

// Map backend data to card format
const courses = computed(() => {
    return journeys.value.map(journey => ({
        id: journey._id,
        title: journey.name,
        description: journey.description,
        rating: journey.averageRating || 0,
        image: journey.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        city: journey.town || ''
    }))
})

// Filtrer les parcours selon la recherche
const filteredCourses = computed(() => {
    if (!searchQuery.value) {
        return courses.value
    }

    const query = searchQuery.value.toLowerCase()
    return courses.value.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.city.toLowerCase().includes(query)
    )
})
</script>

<template>
    <!-- Main Content -->
    <v-main class="bg-grey-lighten-4 main-content">
        <!-- Header and Search Section -->
        <div class="header-section" style="position: sticky; top: -120px; z-index: 10; transition: all 0.3s ease;">
            <!-- Header Section -->
            <div class="pa-6 pt-10">
                <div class="mb-0">
                    <div class="text-h4 font-weight-bold text-white">Salut !</div>
                    <div class="text-h6 text-white mt-2">Bienvenue sur SnapTrack</div>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="search-bar px-6 pb-8 pt-0">
                <TheSearchBar v-model="searchQuery" />
            </div>
        </div>

        <!-- Course Cards -->
        <v-container fluid class="px-6 pb-24 pt-14">
            <!-- Loading State -->
            <v-row v-if="loading" justify="center" class="py-8">
                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            </v-row>

            <!-- Error State -->
            <v-row v-else-if="error">
                <v-col cols="12" class="text-center py-8">
                    <v-icon size="64" color="error">mdi-alert-circle</v-icon>
                    <div class="text-h6 text-error mt-4">Erreur de chargement</div>
                    <div class="text-body-2 text-grey">{{ error }}</div>
                    <v-btn color="primary" class="mt-4" @click="fetchJourneys()">Réessayer</v-btn>
                </v-col>
            </v-row>

            <!-- Results -->
            <v-row v-else-if="filteredCourses.length > 0">
                <v-col cols="12" v-for="course in filteredCourses" :key="course.id">
                    <BaseCard :title="course.title" :description="course.description" :rating="course.rating"
                        :image="course.image" :city="course.city" :show-rating="true" />
                </v-col>
            </v-row>

            <!-- Empty State -->
            <v-row v-else>
                <v-col cols="12" class="text-center py-8">
                    <v-icon size="64" color="grey">mdi-magnify</v-icon>
                    <div class="text-h6 text-grey mt-4">Aucun parcours trouvé</div>
                    <div class="text-body-2 text-grey">Essayez avec d'autres mots-clés</div>
                </v-col>
            </v-row>
        </v-container>
    </v-main>
</template>


<style scoped>
.main-content {
    padding-bottom: 80px;
}

.header-section {
    background: linear-gradient(135deg, #3948ab 0%, #3948ab 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-bar {
    background-color: transparent;
}
</style>
