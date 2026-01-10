<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TheSearchBar from '../TheSearchBar.vue';

const props = defineProps({
  friends: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'create']);

const groupName = ref('');
const selectedFriends = ref([]);
const isCreating = ref(false);
const searchQuery = ref('');
const showAllFriends = ref(false);
const searchContainerRef = ref(null);

const isValid = computed(() => {
  return (
    groupName.value.trim().length > 0 &&
    selectedFriends.value.length >= 1 &&
    selectedFriends.value.length <= 3
  );
});

const filteredFriends = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.friends;
  }

  const query = searchQuery.value.toLowerCase();
  return props.friends.filter(friend =>
    friend.name && friend.name.toLowerCase().startsWith(query)
  );
});

const selectedFriendsData = computed(() => {
  return props.friends.filter(friend => selectedFriends.value.includes(friend.id));
});

const errorMessage = computed(() => {
  if (groupName.value.trim().length === 0) {
    return 'Le nom du groupe est requis';
  }
  if (selectedFriends.value.length === 0) {
    return 'Vous devez sélectionner au moins 1 ami';
  }
  if (selectedFriends.value.length > 3) {
    return 'Maximum 3 amis (4 personnes au total)';
  }
  return '';
});

async function handleCreate() {
  if (!isValid.value || isCreating.value) return;

  isCreating.value = true;

  try {
    // Map selected friend IDs to actual user IDs (friendId field)
    const memberUserIds = selectedFriends.value.map(id => {
      const friend = props.friends.find(f => f.id === id);
      return friend?.friendId || id;
    });

    emit('create', {
      name: groupName.value.trim(),
      memberIds: memberUserIds
    });
  } catch (err) {
    console.error('Erreur lors de la création du groupe:', err);
    isCreating.value = false;
  }
}

function toggleFriend(friendId) {
  const index = selectedFriends.value.indexOf(friendId);
  if (index === -1) {
    if (selectedFriends.value.length < 3) {
      selectedFriends.value.push(friendId);
    }
  } else {
    selectedFriends.value.splice(index, 1);
  }
}

function isFriendSelected(friendId) {
  return selectedFriends.value.includes(friendId);
}

function onSearchFocus() {
  showAllFriends.value = true;
}

function closeSearchList() {
  showAllFriends.value = false;
  searchQuery.value = '';
}

function handleClickOutside(event) {
  if (searchContainerRef.value && !searchContainerRef.value.contains(event.target)) {
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
      Créer un groupe
    </v-card-title>

    <v-card-text>
      <v-text-field v-model="groupName" label="Nom du groupe" placeholder="Entrez le nom du groupe" variant="outlined"
        :disabled="isCreating" class="mb-4"></v-text-field>

      <v-divider class="mb-4"></v-divider>

      <!-- Zone de recherche -->
      <div ref="searchContainerRef">
        <!-- Barre de recherche -->
        <TheSearchBar v-model="searchQuery" :show-clear-button="showAllFriends" @focus="onSearchFocus"
          @close="closeSearchList" class="mb-4" />

        <!-- Liste de tous les amis (conditionnelle) -->
        <div v-if="showAllFriends">
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-2 text-grey-darken-1">
              Tous les amis
            </div>
          </div>

          <v-alert v-if="friends.length === 0" type="info" variant="tonal" class="mb-4">
            Vous n'avez pas encore d'amis. Ajoutez-en pour créer un groupe.
          </v-alert>

          <v-list v-else lines="one" density="compact" class="mb-4">
            <v-list-item v-for="friend in filteredFriends" :key="friend.id" :title="friend.name"
              @click="() => toggleFriend(friend.id)"
              :disabled="isCreating || (!isFriendSelected(friend.id) && selectedFriends.length >= 3)">
              <template v-slot:prepend>
                <v-avatar color="grey-lighten-1">
                  <v-img v-if="friend.profilePicture" :src="friend.profilePicture" cover />
                  <span v-else class="text-h6">{{ friend.name?.charAt(0).toUpperCase() }}</span>
                </v-avatar>
              </template>
              <template v-slot:append>
                <div class="d-flex align-center" style="height: 100%;">
                  <v-checkbox :model-value="isFriendSelected(friend.id)" :disabled="isCreating || (!isFriendSelected(friend.id) && selectedFriends.length >= 3)
                    " @click.stop="() => toggleFriend(friend.id)" hide-details density="compact"></v-checkbox>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="mb-4"></v-divider>
        </div>
      </div>

      <!-- Liste des amis sélectionnés -->
      <div class="text-subtitle-2 mb-2">
        Amis sélectionnés ({{ selectedFriends.length }} / 3)
      </div>

      <v-alert v-if="selectedFriends.length === 0" type="info" variant="tonal" class="mb-4">
        Aucun ami sélectionné
      </v-alert>

      <v-list v-else lines="one" class="mb-4">
        <v-list-item v-for="friend in selectedFriendsData" :key="friend.id" :title="friend.name" class="mb-4">
          <template v-slot:prepend>
            <v-avatar color="grey-lighten-1">
              <v-img v-if="friend.profilePicture" :src="friend.profilePicture" cover />
              <span v-else class="text-h6">{{ friend.name?.charAt(0).toUpperCase() }}</span>
            </v-avatar>
          </template>
          <template v-slot:append>
            <v-btn icon="mdi-close" size="small" variant="text" @click="() => toggleFriend(friend.id)"
              :disabled="isCreating"></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-alert v-if="!isValid && errorMessage" type="warning" variant="tonal" class="mt-4">
        {{ errorMessage }}
      </v-alert>
    </v-card-text>

    <v-card-actions class="justify-center">
      <v-btn color="primary" variant="elevated" :disabled="!isValid || isCreating" :loading="isCreating"
        @click="handleCreate">
        Créer le groupe
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
