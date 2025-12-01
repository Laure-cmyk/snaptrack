<template>
    <v-card rounded="lg" elevation="2" class="base-card">
        <!-- Image Section -->
        <v-img :src="image" height="220" cover class="bg-grey-lighten-2">
            <div v-if="!image" class="d-flex align-center justify-center fill-height">
                <v-icon size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
            </div>
        </v-img>

        <!-- Content Section -->
        <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-start mb-2">
                <!-- Title -->
                <div class="text-subtitle-1 font-weight-bold flex-grow-1">
                    {{ title }}
                </div>

                <!-- Rating -->
                <div class="d-flex align-center ml-2">
                    <v-icon color="yellow-darken-2" size="small" class="mr-1">mdi-star</v-icon>
                    <span class="text-body-2 font-weight-bold">{{ rating.toFixed(1) }}</span>
                </div>
            </div>

            <!-- Description -->
            <div class="text-caption text-grey-darken-1">
                {{ description }}
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: null
    }
})
</script>

<style scoped>
.base-card {
    overflow: hidden;
}
</style>
