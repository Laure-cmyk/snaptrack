<template>
    <v-app>
        <!-- Main Content -->
        <v-main class="bg-grey-lighten-4">
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
                <!-- Search Bar -->
                <TheSearchBar v-model="searchQuery" class="mb-6" />
            </div>

            <!-- Course Cards -->
            <v-container fluid class="px-6 pb-6">
                <v-row>
                    <v-col cols="12" v-for="course in courses" :key="course.id">
                        <BaseCard :title="course.title" :description="course.description" :rating="course.rating"
                            :image="course.image" />
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <!-- Bottom Navigation -->
        <v-bottom-navigation color="indigo-darken-1" mode="shift" grow v-model="activeTab">
            <v-btn value="accueil">
                <v-icon>mdi-home</v-icon>
                <span>Accueil</span>
            </v-btn>

            <v-btn value="amis">
                <v-icon>mdi-account-group</v-icon>
                <span>Amis</span>
            </v-btn>

            <v-btn value="creer">
                <v-icon>mdi-plus-circle</v-icon>
                <span>Créer</span>
            </v-btn>

            <v-btn value="profil" @click="logout">
                <v-icon>mdi-account</v-icon>
                <span>Profil</span>
            </v-btn>
        </v-bottom-navigation>
    </v-app>
</template>

<script setup>
import { ref } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import TheSearchBar from '@/components/TheSearchBar.vue'

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
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
    },
    {
        id: 2,
        title: 'Exploration urbaine',
        description: 'Découvrez la ville autrement',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&q=80'
    }
])

function logout() {
    emit('logout')
}
</script>

<style scoped></style>
