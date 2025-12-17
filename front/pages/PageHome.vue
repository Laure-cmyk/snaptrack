<template>
    <!-- Main Content -->
    <v-main class="bg-grey-lighten-4 main-content">
        <!-- Header and Search Section -->
        <div class="header-section">
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
            </div>
        </div>

        <!-- Course Cards -->
        <v-container fluid class="px-6 pb-24 pt-14">
            <v-row v-if="filteredCourses.length > 0">
                <v-col cols="12" v-for="course in filteredCourses" :key="course.id">
                    <BaseCard :title="course.title" :description="course.description" :rating="course.rating"
                        :image="course.image" :city="course.city" />
                </v-col>
            </v-row>
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

<script setup>
import { ref, computed } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import TheSearchBar from '@/components/TheSearchBar.vue'

const props = defineProps({
    user: {
        type: Object,
        default: null
    }
})

const searchQuery = ref('')

const courses = ref([
    {
        id: 1,
        title: 'Parcours des Toilettes',
        description: '1000 lieux à découvrir',
        rating: 4.0,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        city: 'Yverdon-les-Bains'
    },
    {
        id: 2,
        title: 'Exploration urbaine',
        description: 'Découvrez la ville autrement',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&q=80',
        city: 'Lausanne'
    },
    {
        id: 3,
        title: 'Exploration urbaine',
        description: 'Découvrez la ville autrement',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&q=80',
        city: 'Genève'
    }
])

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

<style scoped>
.main-content {
    padding-bottom: 80px;
}

.header-section {
    background: linear-gradient(135deg, #3948abc9 0%, #3948abeb 100%);
    border-radius: 0 0 30px 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-bar {
    background-color: transparent;
}
</style>
