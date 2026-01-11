<script setup>
defineProps({
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
</script>

<template>
    <v-card rounded="lg" elevation="0" style="background-color: white;">
        <v-card-text class="pa-0">
            <!-- Top 3 -->
            <div v-for="(player, index) in top3" :key="player.userId"
                :class="['d-flex align-center pa-3', { 'border-b': index < top3.length - 1 || currentUser || highlightedUser }]">
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
                    <div class="text-body-2 font-weight-medium">{{ player.username }}</div>
                </div>

                <!-- Score -->
                <div class="text-body-2 font-weight-bold text-indigo-darken-1">{{ player.totalScore }} pts</div>
            </div>

            <!-- Position de l'utilisateur actuel (si pas dans le top 3) -->
            <div v-if="currentUser"
                :class="['d-flex align-center pa-3 bg-indigo-lighten-5', { 'border-b': highlightedUser }]">
                <!-- Rang -->
                <div class="mr-3 text-center" style="width: 32px;">
                    <span class="text-body-2 font-weight-bold text-indigo-darken-1">{{ currentUser.rank }}</span>
                </div>

                <!-- Avatar et nom -->
                <v-avatar size="40" class="mr-3" color="grey-lighten-2">
                    <v-img v-if="currentUser.profilePicture" :src="currentUser.profilePicture" cover />
                    <span v-else class="text-subtitle-2">{{ currentUser.username?.charAt(0).toUpperCase() }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">{{ currentUser.username }} (Moi)</div>
                </div>

                <!-- Score -->
                <div class="text-body-2 font-weight-bold text-indigo-darken-1">{{ currentUser.totalScore }} pts</div>
            </div>

            <!-- Utilisateur mis en évidence (par ex. l'ami) -->
            <div v-if="highlightedUser" class="d-flex align-center pa-3 bg-green-lighten-5">
                <!-- Rang -->
                <div class="mr-3 text-center" style="width: 32px;">
                    <span class="text-body-2 font-weight-bold text-green-darken-2">{{ highlightedUser.rank }}</span>
                </div>

                <!-- Avatar et nom -->
                <v-avatar size="40" class="mr-3" color="grey-lighten-2">
                    <v-img v-if="highlightedUser.profilePicture" :src="highlightedUser.profilePicture" cover />
                    <span v-else class="text-subtitle-2">{{ highlightedUser.username?.charAt(0).toUpperCase() }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">{{ highlightedUser.username }}</div>
                </div>

                <!-- Score -->
                <div class="text-body-2 font-weight-bold text-green-darken-2">{{ highlightedUser.totalScore }} pts</div>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.border-b {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
