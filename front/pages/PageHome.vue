<script setup>
import { ref, computed } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import TheSearchBar from '@/components/TheSearchBar.vue'
import { useFetchJson } from '@/composables/useFetchJson'

// Get user from localStorage
const user = computed(() => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
})

const searchQuery = ref('')

// Fetch journeys from backend (once on load)
const { data: journeysData, loading, error, execute: fetchJourneys } = useFetchJson({
    url: '/journeys',
    immediate: true
})

// Temporary test function for image upload
const testImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Support both 'id' and '_id' for backwards compatibility
        const userId = user.value?.id || user.value?._id
        if (!userId) {
            alert('No user logged in. User data: ' + JSON.stringify(user.value))
            return
        }

        console.log('Uploading for user ID:', userId)

        const formData = new FormData()
        formData.append('image', file)

        try {
            const response = await fetch(`https://snaptrack-nd9h.onrender.com/users/${userId}/upload-profile`, {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (response.ok) {
                alert('Image uploaded successfully!\n' + result.profilePicture)
                // Update localStorage with new profile picture
                const userData = JSON.parse(localStorage.getItem('user'))
                userData.profilePicture = result.profilePicture
                localStorage.setItem('user', JSON.stringify(userData))
            } else {
                alert('Upload failed: ' + result.error)
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }
    input.click()
}

// Map backend data to card format
const courses = computed(() => {
    if (!journeysData.value?.journeys) return []
    return journeysData.value.journeys.map(journey => ({
        id: journey._id,
        title: journey.name,
        description: journey.description,
        rating: journey.averageRating || 0,
        image: journey.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        city: journey.town || ''
    }))
})

// Filter courses client-side based on search query
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
                    <div class="text-h4 font-weight-bold text-white">Salut, {{ user?.username || 'Bruno' }}</div>
                    <div class="text-h6 text-white mt-2">Bienvenue sur SnapTrack</div>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="search-bar px-6 pb-8 pt-0">
                <TheSearchBar v-model="searchQuery" />
                <button id="temp" @click="testImageUpload" style="background: #fff; padding: 8px 16px; border-radius: 4px; margin-top: 8px; cursor: pointer;">
                    Test Profile Upload
                </button>
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
