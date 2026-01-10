<script setup>
import { ref, onMounted } from 'vue'
import BaseHeader from '@/components/BaseHeader.vue'

const props = defineProps({
    userId: { type: String, required: true }
})

const emit = defineEmits(['close'])

const loading = ref(true)
const user = ref({
    username: '',
    email: '',
    bio: '',
    profilePicture: null
})

async function loadUserData() {
    loading.value = true

    try {
        const res = await fetch(`/users/${props.userId}`)

        if (!res.ok) {
            console.warn('API returned:', res.status)
            loading.value = false
            return
        }

        const data = await res.json()
        user.value = {
            username: data.username,
            email: data.email,
            bio: data.bio || '',
            profilePicture: data.profilePicture
        }
    } catch (err) {
        console.error('Error loading user:', err)
    } finally {
        loading.value = false
    }
}

onMounted(loadUserData)
</script>

<template>
    <v-card rounded="0">
        <BaseHeader title="" :show-back="true" @back="emit('close')" />

        <v-card-text v-if="loading" class="d-flex justify-center align-center py-16">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        </v-card-text>

        <v-card-text v-else class="px-6 py-8">
            <!-- Photo de profil -->
            <div class="d-flex justify-center mb-6">
                <v-avatar size="120" color="grey-lighten-1">
                    <v-img v-if="user.profilePicture" :src="user.profilePicture" cover />
                    <span v-else class="text-h3">{{ user.username?.charAt(0).toUpperCase() }}</span>
                </v-avatar>
            </div>

            <!-- Nom d'utilisateur -->
            <div class="text-center mb-6">
                <div class="text-h5 font-weight-bold">{{ user.username }}</div>
            </div>

            <!-- Bio -->
            <v-card variant="outlined" rounded="lg" class="mb-4">
                <v-card-title class="text-subtitle-1">Bio</v-card-title>
                <v-card-text>
                    <div v-if="user.bio" class="text-body-2">{{ user.bio }}</div>
                    <div v-else class="text-body-2 text-grey-lighten-1">Aucune bio</div>
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>
</template>

<style scoped></style>
