<script setup>
defineProps({
    location: {
        type: Object,
        required: true
    },
    currentIndex: {
        type: Number,
        required: true
    },
    totalLocations: {
        type: Number,
        required: true
    }
})

defineEmits(['add-location', 'quit'])
</script>

<template>
    <div>
        <!-- Progress indicator -->
        <div class="mb-6">
            <div class="text-caption text-grey-darken-1 mb-2">
                Lieu {{ currentIndex + 1 }} / {{ totalLocations }}
            </div>
            <v-progress-linear :model-value="((currentIndex + 1) / totalLocations) * 100" color="indigo-darken-1"
                height="6" rounded />
        </div>

        <!-- Image du lieu -->
        <v-img :src="location.image" aspect-ratio="3/4" cover class="bg-grey-lighten-2 mb-6" rounded="lg">
            <div v-if="!location.image" class="d-flex align-center justify-center fill-height">
                <v-icon size="60" color="grey-lighten-1">mdi-image-outline</v-icon>
            </div>
        </v-img>

        <!-- Énigme -->
        <div class="mb-12">
            <div class="enigma-box pa-3 bg-grey-lighten-4">
                <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                    <v-icon size="small" class="mr-1" color="indigo-darken-1">mdi-puzzle</v-icon>
                    Énigme
                </div>
                <p class="text-body-2 text-grey-darken-1 ma-0">{{ location.description }}</p>
            </div>
        </div>

        <!-- Boutons d'action -->
        <div class="d-flex flex-column ga-3">
            <v-btn block size="x-large" color="indigo-darken-1" rounded="lg" elevation="2" variant="flat"
                prepend-icon="mdi-map-marker-plus" @click="$emit('add-location')">
                Ajouter la localisation
            </v-btn>

            <v-btn block size="x-large" color="red-darken-1" rounded="lg" variant="outlined"
                prepend-icon="mdi-exit-to-app" @click="$emit('quit')">
                Quitter le challenge
            </v-btn>
        </div>
    </div>
</template>

<style scoped>
.enigma-box {
    border: 3px solid #3948ab;
    border-radius: 8px;
}
</style>
