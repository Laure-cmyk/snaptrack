<template>
    <v-app>
        <!-- App Bar -->
        <v-app-bar color="white" elevation="0">
            <v-app-bar-title class="text-h6 font-weight-bold ml-2">
                Salut, {{ user?.username || 'Bruno' }}
            </v-app-bar-title>
        </v-app-bar>

        <!-- Main Content -->
        <v-main class="bg-grey-lighten-4">
            <v-container fluid class="pa-4">
                <!-- Search Bar -->
                <v-text-field placeholder="Chercher un parcours" variant="outlined" density="comfortable"
                    prepend-inner-icon="mdi-magnify" class="mb-4 bg-white" rounded hide-details />

                <!-- Course Cards -->
                <v-row>
                    <v-col cols="12" v-for="course in courses" :key="course.id">
                        <v-card rounded="lg" elevation="2">
                            <!-- Course Image -->
                            <v-img :src="course.image" height="150" cover class="bg-grey-lighten-2">
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-icon size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
                                </div>
                            </v-img>

                            <!-- Course Info -->
                            <v-card-text class="pb-2">
                                <div class="text-h6 font-weight-bold mb-1">
                                    {{ course.title }}
                                </div>
                                <div class="text-caption text-grey-darken-1 mb-2">
                                    {{ course.description }}
                                </div>

                                <!-- Rating -->
                                <div class="d-flex align-center">
                                    <v-rating :model-value="course.rating" density="compact" size="small"
                                        color="yellow-darken-2" readonly half-increments />
                                </div>
                            </v-card-text>
                        </v-card>
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

const props = defineProps({
    user: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['logout'])

const activeTab = ref('accueil')

const courses = ref([
    {
        id: 1,
        title: 'Parcours des Toilettes',
        description: 'Find these 10 common objects which corresponds to one of the numbers in Common weight name slapping.',
        rating: 4,
        image: null
    },
    {
        id: 2,
        title: 'Parcours 2',
        description: 'Description du deuxième parcours à découvrir.',
        rating: 4.5,
        image: null
    }
])

function logout() {
    emit('logout')
}
</script>

<style scoped></style>
