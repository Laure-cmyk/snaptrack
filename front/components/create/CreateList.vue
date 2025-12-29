<script setup>
import BaseCard from '@/components/BaseCard.vue'

defineProps({
    trails: {
        type: Array,
        required: true
    }
})

defineEmits(['create-new', 'edit', 'delete'])
</script>

<template>
    <div class="pa-6">
        <!-- Empty State -->
        <div v-if="trails.length === 0" class="text-center py-12">
            <v-icon size="80" color="grey-lighten-1">mdi-map-marker-path</v-icon>
            <div class="text-h6 text-grey mt-4 mb-2">Aucun parcours créé</div>
            <div class="text-body-2 text-grey mb-6">Commencez par créer votre premier parcours</div>
            <v-btn color="indigo-darken-1" size="large" rounded="lg" elevation="2" variant="flat"
                prepend-icon="mdi-plus" @click="$emit('create-new')">
                Créer un parcours
            </v-btn>
        </div>

        <!-- Trails List -->
        <div v-else>
            <!-- Trail Cards -->
            <v-row>
                <v-col cols="12" v-for="item in trails" :key="item.id">
                    <BaseCard :title="item.title" :description="item.description" :image="item.image" :city="item.city"
                        :show-delete="true" :clickable="true" @click="$emit('edit', item)"
                        @delete="$emit('delete', item)" />
                </v-col>
            </v-row>
        </div>

        <!-- Floating Action Button -->
        <v-btn v-if="trails.length > 0" icon color="indigo-darken-1" size="x-large" class="fab-button" elevation="6"
            @click="$emit('create-new')">
            <v-icon color="white" size="large">mdi-plus</v-icon>
        </v-btn>
    </div>
</template>

<style scoped>
.fab-button {
    position: fixed;
    bottom: 100px;
    right: 24px;
    z-index: 5;
}
</style>
