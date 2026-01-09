<script setup>
defineProps({
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
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    showRating: {
        type: Boolean,
        default: false
    },
    showDelete: {
        type: Boolean,
        default: false
    },
    clickable: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click', 'delete'])

function handleClick() {
    emit('click')
}

</script>

<template>
    <v-card rounded="lg" elevation="2" class="base-card" style="cursor: pointer;" @click="$emit('click')">
        <!-- Image Section -->
        <v-img :src="image" height="220" cover class="bg-grey-lighten-2">
            <div v-if="!image" class="d-flex align-center justify-center fill-height">
                <v-icon size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
            </div>
        </v-img>

        <!-- Content -->
        <v-card-text class="pa-4 position-relative">
            <!-- Title & Rating -->
            <div class="d-flex justify-space-between align-start mb-2">
                <div class="text-h6 font-weight-bold flex-grow-1">
                    {{ title }}
                </div>

                <div v-if="showRating" class="d-flex align-center ml-2">
                    <v-icon color="yellow-darken-2" size="small" class="mr-1">mdi-star</v-icon>
                    <span class="text-body-2 font-weight-bold">{{ rating.toFixed(1) }}</span>
                </div>
            </div>

            <!-- Description -->
            <div class="text-body-2 text-grey-darken-1 mb-3">
                {{ description }}
            </div>

            <!-- City -->
            <div v-if="city" class="d-flex align-center text-caption text-grey">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                <span>{{ city }}</span>
            </div>

            <!-- Delete Button -->
            <v-btn v-if="showDelete" icon size="small" variant="text" class="delete-btn" @click.stop="$emit('delete')">
                <v-icon color="black">mdi-delete</v-icon>
            </v-btn>
        </v-card-text>
    </v-card>
</template>


<style scoped>
.base-card {
    transition: transform 0.2s ease;
}

.cursor-pointer {
    cursor: pointer;
}

.cursor-pointer:hover {
    transform: translateY(-2px);
}

.delete-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
}
</style>
