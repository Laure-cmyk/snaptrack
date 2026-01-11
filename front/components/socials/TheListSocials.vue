<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getDeleteLabel, getDeleteResult } from '../../utils/negativeAction';
import TheSearchBar from '../TheSearchBar.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  currentUserId: { type: String, default: null },
  friends: { type: Array, default: () => [] },
  sentInviteIds: { type: Set, default: () => new Set() },
  sentPendingRequests: { type: Array, default: () => [] },
  showSearch: { type: Boolean, default: false },
  addLabel: { type: String, default: 'Inviter' },
  acceptLabel: { type: String, default: 'Accepter' },
  pendingLabel: { type: String, default: 'En attente' },
  addedLabel: { type: String, default: 'Amis' },
  deleteLabel: { type: String, default: 'Refuser' },
  removeLabel: { type: String, default: 'Supprimer' },
  youLabel: { type: String, default: 'Vous' },
  showButton: { type: Boolean, default: true },
  onInvite: { type: Function, default: null },
  onRemoveFriend: { type: Function, default: null }
});

const emit = defineEmits(['action', 'click']);

const searchQuery = ref('');
const showSearchResults = ref(false);
const searchContainerRef = ref(null);
const stateMap = ref({});

// Computed for filtered search results
const filteredUsers = computed(() => {
  if (!showSearchResults.value || !props.showSearch) return [];

  let result = props.allUsers;

  // Filter by username that starts with the search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      user.username && user.username.toLowerCase().startsWith(query)
    );
  }

  // Sort: friends first, then others
  return result.sort((a, b) => {
    const aIsFriend = isFriend(a._id);
    const bIsFriend = isFriend(b._id);

    if (aIsFriend && !bIsFriend) return -1;
    if (!aIsFriend && bIsFriend) return 1;
    return 0;
  });
});

function isFriend(userId) {
  return props.friends.some(friend => friend.friendId === userId);
}

function hasSentInvite(userId) {
  return props.sentInviteIds.has(userId);
}

function onSearchFocus() {
  showSearchResults.value = true;
}

function closeSearch() {
  showSearchResults.value = false;
  searchQuery.value = '';
}

function handleClickOutside(event) {
  if (searchContainerRef.value && !searchContainerRef.value.contains(event.target)) {
    closeSearch();
  }
}

onMounted(() => {
  if (props.showSearch) {
    document.addEventListener('mousedown', handleClickOutside);
  }
});

onUnmounted(() => {
  if (props.showSearch) {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});

async function handleAccept(item, index) {
  const key = item?.id ?? index;
  if (stateMap.value[key] === props.pendingLabel) return;
  if (stateMap.value[key] === props.addedLabel) return;

  stateMap.value[key] = props.pendingLabel;

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    stateMap.value[key] = props.addedLabel;
    emit('action', { item, index, result: 'success' });
  } catch (err) {
    stateMap.value[key] = props.acceptLabel;
    emit('action', { item, index, result: 'error', error: err });
  }
}

async function handleDelete(item, index) {
  const key = item?.id ?? index;
  if (stateMap.value[key] === props.pendingLabel) return;

  stateMap.value[key] = props.pendingLabel;

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    const result = getDeleteResult(item);
    emit('action', { item, index, result });
  } catch (err) {
    stateMap.value[key] = item.type === 'invite' ? props.acceptLabel : props.addedLabel;
    emit('action', { item, index, result: 'error', error: err });
  }
}

function handleClick(item) {
  if (item.type === 'group' || item.type === 'friend') {
    emit('click', item);
  }
}

function handleInvite(user) {
  if (props.onInvite) {
    props.onInvite(user);
  }
}

function handleRemoveFriend(user) {
  if (props.onRemoveFriend) {
    props.onRemoveFriend(user);
  }
}

function getButtonState(item, index) {
  const key = item?.id ?? index;
  if (stateMap.value[key]) return stateMap.value[key];
  return item.type === 'friend' || item.type === 'group' ? props.addedLabel : props.acceptLabel;
}
</script>

<template>
  <div ref="searchContainerRef">
    <!-- Search Bar -->
    <v-card-text v-if="showSearch" class="pb-0">
      <TheSearchBar v-model="searchQuery" :show-clear-button="showSearchResults" @focus="onSearchFocus"
        @close="closeSearch" />
    </v-card-text>

    <!-- All Users List when search is active -->
    <v-card-text v-if="showSearchResults && showSearch" class="pt-6" style="max-height: 60vh; overflow-y: auto;">
      <div class="text-subtitle-2 text-grey-darken-1 mb-2">
        {{ searchQuery ? `Résultats pour "${searchQuery}"` : 'Tous les utilisateurs' }}
      </div>
      <v-list v-if="filteredUsers.length > 0" lines="one">
        <v-list-item v-for="user in filteredUsers" :key="user._id" :title="user.username">
          <template v-slot:prepend>
            <v-avatar color="grey-lighten-1">
              <v-img v-if="user.profilePicture" :src="user.profilePicture" cover />
              <span v-else class="text-h6">{{ user.username?.charAt(0).toUpperCase() }}</span>
            </v-avatar>
          </template>
          <template v-slot:append>
            <v-btn v-if="user._id === currentUserId" size="small" variant="text" disabled>
              {{ youLabel }}
            </v-btn>
            <v-btn v-else-if="isFriend(user._id)" size="small" variant="outlined" color="error"
              @click="handleRemoveFriend({ id: user._id, name: user.username })">
              {{ removeLabel }}
            </v-btn>
            <v-btn v-else-if="hasSentInvite(user._id)" size="small" variant="outlined" color="grey" disabled>
              {{ pendingLabel }}
            </v-btn>
            <v-btn v-else size="small" variant="outlined" color="primary"
              @click="handleInvite({ id: user._id, name: user.username })">
              {{ addLabel }}
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
      <div v-else class="text-center text-grey py-4">
        Aucun utilisateur trouvé
      </div>
    </v-card-text>

    <!-- Sent Pending Requests when search is not active -->
    <v-card-text v-if="!showSearchResults && sentPendingRequests.length > 0">
      <div class="text-subtitle-2 text-grey-darken-1 mb-2 mt-4">
        Invitations envoyées (en attente)
      </div>
      <v-list lines="one">
        <v-list-item v-for="request in sentPendingRequests" :key="request.id" :title="request.name">
          <template v-slot:prepend>
            <v-avatar color="grey-lighten-1">
              <v-img v-if="request.profilePicture" :src="request.profilePicture" cover />
              <span v-else class="text-h6">{{ request.name?.charAt(0).toUpperCase() }}</span>
            </v-avatar>
          </template>
          <template v-slot:append>
            <v-chip size="small" color="warning" variant="outlined">{{ pendingLabel }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- Regular Items List when search is not active -->
    <v-list v-if="!showSearchResults && items.length > 0" lines="two">
      <v-list-item v-for="(item, index) in items" :key="item?.id ?? index" @click="() => handleClick(item)"
        :title="item?.name ?? item?.title ?? 'User ' + (index + 1)">
        <template v-slot:prepend>
          <v-avatar color="grey-lighten-1">
            <v-img v-if="item.profilePicture" :src="item.profilePicture" cover />
            <span v-else class="text-h6">{{ (item?.name ?? item?.title ?? 'U')?.charAt(0).toUpperCase() }}</span>
          </v-avatar>
        </template>
        <template v-slot:append>
          <template v-if="showButton && item.type === 'invite' && getButtonState(item, index) === acceptLabel">
            <v-btn size="small" variant="outlined" @click.stop="() => handleAccept(item, index)">
              {{ getButtonState(item, index) }}
            </v-btn>
            <v-btn size="small" variant="outlined" color="error" @click.stop="() => handleDelete(item, index)">
              {{ getDeleteLabel(item) }}
            </v-btn>
          </template>
          <v-btn v-else-if="showButton && item.type === 'invite' && getButtonState(item, index) !== acceptLabel" 
            size="small" variant="outlined" disabled>
            {{ getButtonState(item, index) }}
          </v-btn>
          <v-btn v-else-if="showButton && item.type === 'friend'" size="small" color="error" variant="text"
            :disabled="getButtonState(item, index) === pendingLabel" @click.stop="() => handleDelete(item, index)">
            {{ getDeleteLabel(item) }}
          </v-btn>
        </template>
        <v-divider v-if="index < items.length - 1" />
      </v-list-item>
    </v-list>
  </div>
</template>