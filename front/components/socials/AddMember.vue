<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TheSearchBar from '../TheSearchBar.vue';

const props = defineProps({
    friends: { type: Array, default: () => [] },
    currentMembers: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'add']);

const selectedFriend = ref(null);
const isAdding = ref(false);
const searchQuery = ref('');
const showAllFriends = ref(false);
const searchContainerRef = ref(null);
const addButtonRef = ref(null);

const isValid = computed(() => {
    return selectedFriend.value !== null;
});

// Filtrer les amis qui ne sont pas déjà membres du groupe
const availableFriends = computed(() => {
    const currentMemberIds = props.currentMembers.map(m => m.id);
    return props.friends.filter(friend => !currentMemberIds.includes(friend.friendId));
});

const filteredFriends = computed(() => {
    let result = availableFriends.value;

    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(friend =>
            friend.name && friend.name.toLowerCase().startsWith(query)
        );
    }

    return result;
});

const selectedFriendData = computed(() => {
    if (!selectedFriend.value) return null;
    return props.friends.find(f => f.id === selectedFriend.value);
});

async function handleAdd() {
    if (!isValid.value || isAdding.value) return;

    isAdding.value = true;

    try {
        const friend = props.friends.find(f => f.id === selectedFriend.value);
        const memberUserId = friend?.friendId || selectedFriend.value;

        emit('add', memberUserId);
    } catch (err) {
        console.error('Erreur lors de l\'ajout du membre:', err);
        isAdding.value = false;
    }
}

function selectFriend(friendId) {
    selectedFriend.value = friendId;
}

function unselectFriend() {
    selectedFriend.value = null;
}

function onSearchFocus() {
    showAllFriends.value = true;
}

function closeSearchList() {
    showAllFriends.value = false;
    searchQuery.value = '';
}

function handleClickOutside(event) {
    // Ne pas fermer si on clique sur le bouton "Ajouter au groupe" ou dans la zone de recherche
    if (searchContainerRef.value && !searchContainerRef.value.contains(event.target)) {
        if (addButtonRef.value && addButtonRef.value.$el.contains(event.target)) {
            return; // Ne pas fermer si on clique sur le bouton d'ajout
        }
        closeSearchList();
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<template>
    <v-card>
        <v-card-title class="d-flex align-center">
            <v-btn icon="mdi-arrow-left" variant="text" @click="emit('close')" class="mr-2"></v-btn>
            Ajouter un membre
        </v-card-title>

        <v-card-text>
            <!-- Zone de recherche -->
            <div ref="searchContainerRef">
                <!-- Barre de recherche -->
                <TheSearchBar v-model="searchQuery" :show-clear-button="showAllFriends" @focus="onSearchFocus"
                    @close="closeSearchList" class="mb-4" />

                <!-- Liste de tous les amis disponibles (conditionnelle) -->
                <div v-if="showAllFriends">
                    <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-subtitle-2 text-grey-darken-1">
                            Amis disponibles
                        </div>
                    </div>

                    <v-alert v-if="availableFriends.length === 0" type="info" variant="tonal" class="mb-4">
                        Tous vos amis sont déjà membres du groupe.
                    </v-alert>

                    <v-list v-else lines="one" density="compact" class="mb-4">
                        <v-list-item v-for="friend in filteredFriends" :key="friend.id" :title="friend.name"
                            @click="() => selectFriend(friend.id)" :disabled="isAdding">
                            <template v-slot:prepend>
                                <v-avatar color="grey-lighten-1">
                                    <v-img v-if="friend.profilePicture" :src="friend.profilePicture" cover />
                                    <span v-else class="text-h6">{{ friend.name?.charAt(0).toUpperCase() }}</span>
                                </v-avatar>
                            </template>
                            <template v-slot:append>
                                <div class="d-flex align-center" style="height: 100%;">
                                    <v-radio-group v-model="selectedFriend" hide-details density="compact">
                                        <v-radio :value="friend.id"
                                            @click.stop="() => selectFriend(friend.id)"></v-radio>
                                    </v-radio-group>
                                </div>
                            </template>
                        </v-list-item>
                    </v-list>

                    <v-divider class="mb-4"></v-divider>
                </div>
            </div>

            <!-- Ami sélectionné -->
            <div class="text-subtitle-2 mb-2">
                Ami sélectionné
            </div>

            <v-alert v-if="!selectedFriend" type="info" variant="tonal" class="mb-4">
                Aucun ami sélectionné
            </v-alert>

            <v-list v-else lines="one" class="mb-4">
                <v-list-item :title="selectedFriendData.name">
                    <template v-slot:prepend>
                        <v-avatar color="grey-lighten-1">
                            <v-img v-if="selectedFriendData.profilePicture" :src="selectedFriendData.profilePicture"
                                cover />
                            <span v-else class="text-h6">{{ selectedFriendData.name?.charAt(0).toUpperCase() }}</span>
                        </v-avatar>
                    </template>
                    <template v-slot:append>
                        <v-btn icon="mdi-close" size="small" variant="text" @click="unselectFriend"
                            :disabled="isAdding"></v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>

        <v-card-actions class="justify-center">
            <v-btn ref="addButtonRef" color="primary" variant="elevated" :disabled="!isValid || isAdding"
                :loading="isAdding" @click="handleAdd">
                Ajouter au groupe
            </v-btn>
        </v-card-actions>
    </v-card>
</template>
