<template>
    <v-app>
        <!-- Main Content -->
        <v-main class="bg-grey-lighten-4 main-content">
            <!-- Header Section -->
            <div class="pa-6 pt-12">
                <div class="d-flex align-center mb-6">
                    <v-avatar size="45" class="mr-3">
                        <v-img src="https://i.pravatar.cc/150?img=12" alt="Photo de profil" />
                    </v-avatar>
                    <div>
                        <div class="text-subtitle-1 font-weight-bold">Salut, {{ user?.username || 'Bruno' }}</div>
                        <div class="text-body-2 text-grey">Bienvenue sur SnapTrack</div>
                    </div>
                </div>
            </div>

            <!-- Sticky Search Bar -->
            <div class="search-bar-sticky px-6 pb-6 pt-4">
                <TheSearchBar v-model="searchQuery" />
            </div>

            <!-- Course Cards -->
            <v-container fluid class="px-6 pb-24">
                <v-row>
                    <v-col cols="12" v-for="course in courses" :key="course.id">
                        <BaseCard :title="course.title" :description="course.description" :rating="course.rating"
                            :image="course.image" :city="course.city" />
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <!-- Bottom Navigation -->
        <TheBottomNavigation v-model="activeTab" />
    </v-app>
</template>

<script setup>
import { ref } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import TheSearchBar from '@/components/TheSearchBar.vue'
import TheBottomNavigation from '@/components/TheBottomNavigation.vue'

const props = defineProps({
    user: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['logout'])

const activeTab = ref('accueil')
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

function logout() {
    emit('logout')
}
</script>

<style scoped>
.main-content {
    padding-bottom: 80px !important;
}

.search-bar-sticky {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #f5f5f5;
    backdrop-filter: blur(8px);
    padding-top: 16px !important;
}
</style>
