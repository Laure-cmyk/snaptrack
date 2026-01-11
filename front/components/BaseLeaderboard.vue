<script setup>
import { computed } from 'vue'

const props = defineProps({
    top3: {
        type: Array,
        default: () => []
    },
    currentUser: {
        type: Object,
        default: null
    },
    highlightedUser: {
        type: Object,
        default: null
    }
})

// Vérifier si un utilisateur du top3 doit être mis en surbrillance
const isUserHighlighted = (userId) => {
    if (props.currentUser && userId.toString() === props.currentUser.userId.toString()) return 'current'
    if (props.highlightedUser && userId.toString() === props.highlightedUser.userId.toString()) return 'highlighted'
    return null
}

// Trier currentUser et highlightedUser par score (décroissant)
const sortedAdditionalUsers = computed(() => {
    const users = []

    // Vérifier si currentUser est dans le top3
    const currentUserInTop3 = props.currentUser && props.top3.some(p => p.userId.toString() === props.currentUser.userId.toString())
    // Vérifier si highlightedUser est dans le top3
    const highlightedUserInTop3 = props.highlightedUser && props.top3.some(p => p.userId.toString() === props.highlightedUser.userId.toString())

    if (props.currentUser && !currentUserInTop3) users.push({ ...props.currentUser, isCurrentUser: true })
    if (props.highlightedUser && !highlightedUserInTop3) users.push({ ...props.highlightedUser, isHighlighted: true })

    // Trier par score décroissant (meilleur score en premier)
    return users.sort((a, b) => b.totalScore - a.totalScore)
})

</script>

<template>
    <v-card rounded="lg" elevation="0" style="background-color: white;">
        <v-card-text class="pa-0">
            <!-- Top 3 -->
            <div v-for="(player, index) in top3" :key="player.userId" :class="[
                'd-flex align-center pa-3',
                { 'bg-indigo-lighten-5': isUserHighlighted(player.userId) === 'current' },
                { 'bg-green-lighten-5': isUserHighlighted(player.userId) === 'highlighted' },
                { 'border-b': index < top3.length - 1 || sortedAdditionalUsers.length > 0 }
            ]">
                <!-- Rang -->
                <div class="mr-3 text-center" style="width: 32px;">
                    <v-icon v-if="index === 0" color="yellow-darken-2" size="small">mdi-trophy</v-icon>
                    <v-icon v-else-if="index === 1" color="grey-darken-1" size="small">mdi-trophy</v-icon>
                    <v-icon v-else-if="index === 2" color="orange-darken-2" size="small">mdi-trophy</v-icon>
                </div>

                <!-- Avatar et nom -->
                <v-avatar size="40" class="mr-3" color="grey-lighten-2">
                    <v-img v-if="player.profilePicture" :src="player.profilePicture" cover />
                    <span v-else class="text-subtitle-2">{{ player.username?.charAt(0).toUpperCase() }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">
                        {{ player.username }}{{ isUserHighlighted(player.userId) === 'current' ? ' (Moi)' : '' }}
                    </div>
                </div>

                <!-- Score -->
                <div class="text-body-2 font-weight-bold" :class="isUserHighlighted(player.userId) === 'current' ? 'text-indigo-darken-1' :
                    isUserHighlighted(player.userId) === 'highlighted' ? 'text-green-darken-2' :
                        'text-indigo-darken-1'">
                    {{ player.totalScore }} pts
                </div>
            </div>

            <!-- Utilisateurs additionnels triés par rang -->
            <div v-for="(user, index) in sortedAdditionalUsers" :key="user.userId" :class="[
                'd-flex align-center pa-3',
                { 'bg-indigo-lighten-5': user.isCurrentUser },
                { 'bg-green-lighten-5': user.isHighlighted },
                { 'border-b': index < sortedAdditionalUsers.length - 1 }
            ]">
                <!-- Rang -->
                <div class="mr-3 text-center" style="width: 32px;">
                    <span class="text-body-2 font-weight-bold"
                        :class="user.isCurrentUser ? 'text-indigo-darken-1' : 'text-green-darken-2'">
                        {{ user.rank }}
                    </span>
                </div>

                <!-- Avatar et nom -->
                <v-avatar size="40" class="mr-3" color="grey-lighten-2">
                    <v-img v-if="user.profilePicture" :src="user.profilePicture" cover />
                    <span v-else class="text-subtitle-2">{{ user.username?.charAt(0).toUpperCase() }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">
                        {{ user.username }}{{ user.isCurrentUser ? ' (Moi)' : '' }}
                    </div>
                </div>

                <!-- Score -->
                <div class="text-body-2 font-weight-bold"
                    :class="user.isCurrentUser ? 'text-indigo-darken-1' : 'text-green-darken-2'">
                    {{ user.totalScore }} pts
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.border-b {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
