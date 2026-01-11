<script setup>
import { ref, onMounted } from 'vue'
import BaseHeader from '@/components/BaseHeader.vue'
import BaseScoreDisplay from '@/components/BaseScoreDisplay.vue'
import BaseLeaderboard from '@/components/BaseLeaderboard.vue'

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
const totalPoints = ref(0)
const leaderboard = ref({ top3: [], userPosition: null, friendPosition: null })
const currentUserId = ref(null)

async function loadUserData() {
    loading.value = true

    // Get current user ID from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
        const currentUser = JSON.parse(storedUser)
        currentUserId.value = currentUser.id || currentUser._id
    }

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

        // Fetch total points from database
        try {
            const scoresRes = await fetch(`/scores/totals?userId=${props.userId}`)
            if (scoresRes.ok) {
                const scoresData = await scoresRes.json()
                totalPoints.value = scoresData.totals.score || 0
            } else {
                console.warn('Failed to fetch scores:', scoresRes.status)
                totalPoints.value = 0
            }
        } catch (err) {
            console.error('Error fetching total points:', err)
            totalPoints.value = 0
        }

        // Fetch leaderboard with friend position
        try {
            const leaderboardRes = await fetch(`/scores/leaderboard/global?userId=${currentUserId.value}&friendId=${props.userId}`)
            if (leaderboardRes.ok) {
                const leaderboardData = await leaderboardRes.json()

                leaderboard.value.top3 = leaderboardData.top3
                leaderboard.value.userPosition = leaderboardData.userPosition
                leaderboard.value.friendPosition = leaderboardData.friendPosition
            }
        } catch (err) {
            console.error('Error fetching leaderboard:', err)
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

            <!-- Total de points -->
            <div class="mb-6">
                <BaseScoreDisplay :score="totalPoints" />
            </div>

            <!-- Classement -->
            <div class="mb-16">
                <div class="text-subtitle-1 font-weight-bold mb-3">Classement</div>
                <BaseLeaderboard :top3="leaderboard.top3" :currentUser="leaderboard.userPosition"
                    :highlightedUser="leaderboard.friendPosition" />
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped></style>
