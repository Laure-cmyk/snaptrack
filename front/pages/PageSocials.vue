<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TheListSocials from '../components/socials/TheListSocials.vue';
import TheGroup from '../components/socials/TheGroup.vue';
import CreateGroup from '../components/socials/CreateGroup.vue';
import AddMember from '../components/socials/AddMember.vue';
import UserProfile from '../components/socials/UserProfile.vue';
import TheSearchBar from '../components/TheSearchBar.vue';
import { fetchJson } from '@/utils/fetchJson';

const tab = ref('friends');
const selectedGroupId = ref(null);
const selectedUserId = ref(null);
const isCreatingGroup = ref(false);
const isAddingMember = ref(false);
const currentGroupMembers = ref([]);
const searchQuery = ref('');
const showSearchResults = ref(false);
const allUsers = ref([]);
const sendingInvites = ref({});
const searchContainerRef = ref(null);

// Get current user from localStorage - use ref for reliability
const storedUser = ref(null);

function loadStoredUser() {
  const userData = localStorage.getItem('user');
  storedUser.value = userData ? JSON.parse(userData) : null;
}

const userId = computed(() => storedUser.value?.id || storedUser.value?._id);

// API calls
const friends = ref([]);
const friendInvite = ref([]);
const sentPendingRequests = ref([]);
const groupInvite = ref([]);
const groups = ref([]);
const loading = ref(true);
const error = ref(null);

async function loadData() {
  // First load user from localStorage
  loadStoredUser();

  if (!userId.value) {
    console.warn('PageSocials: No userId found');
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Fetch all users
    const usersRes = await fetch('/users');
    if (usersRes.ok) {
      allUsers.value = await usersRes.json();
    }

    // Fetch friends
    const friendsRes = await fetch(`/friends/list/${userId.value}`);
    if (!friendsRes.ok) {
      console.warn('Friends API error:', friendsRes.status);
    }
    const friendsData = await friendsRes.json();

    if (Array.isArray(friendsData)) {
      friends.value = friendsData.map(f => ({
        id: f.friendshipId,
        name: f.friendName,
        friendId: f.friendId,
        profilePicture: f.profilePicture,
        type: 'friend'
      }));
    }

    // Fetch pending friend requests
    const pendingFriendsRes = await fetch(`/friends/requests/pending/${userId.value}`);
    if (!pendingFriendsRes.ok) {
      console.warn('Pending friends API error:', pendingFriendsRes.status);
    }
    const pendingFriendsData = await pendingFriendsRes.json();

    if (Array.isArray(pendingFriendsData)) {
      friendInvite.value = pendingFriendsData;
    }

    // Fetch sent pending friend requests (requests I sent that are still pending)
    const sentPendingRes = await fetch(`/friends/requests/sent/${userId.value}`);
    if (sentPendingRes.ok) {
      const sentPendingData = await sentPendingRes.json();
      if (Array.isArray(sentPendingData)) {
        sentPendingRequests.value = sentPendingData.map(r => ({
          id: r.id,
          name: r.name,
          profilePicture: r.profilePicture,
          type: 'pending-sent'
        }));
      }
    }

    // Fetch user groups
    const groupsRes = await fetch(`/groups/user/${userId.value}`);
    if (!groupsRes.ok) {
      console.warn('Groups API error:', groupsRes.status);
    }
    const groupsData = await groupsRes.json();

    if (Array.isArray(groupsData)) {
      groups.value = groupsData.map(g => ({
        id: g._id,
        name: g.name,
        profilePicture: g.profilePicture,
        type: 'group'
      }));
    }

    // Fetch pending group invites
    const pendingGroupsRes = await fetch(`/user-groups/pending/${userId.value}`);
    if (!pendingGroupsRes.ok) {
      console.warn('Pending groups API error:', pendingGroupsRes.status);
    }
    const pendingGroupsData = await pendingGroupsRes.json();

    if (Array.isArray(pendingGroupsData)) {
      groupInvite.value = pendingGroupsData;
    }
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Computed for filtered search results
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return [];
  }

  const query = searchQuery.value.toLowerCase();
  const existingFriendIds = friends.value.map(f => f.friendId);
  const pendingRequestIds = friendInvite.value.map(f => f.requesterId || f.recipientId);

  return allUsers.value
    .filter(user => {
      if (!user.username) return false;

      const matchesSearch = user.username.toLowerCase().includes(query);
      const isNotCurrentUser = user._id !== userId.value;
      const isNotFriend = !existingFriendIds.includes(user._id);
      const noPendingRequest = !pendingRequestIds.includes(user._id);

      return matchesSearch && isNotCurrentUser && isNotFriend && noPendingRequest;
    })
    .map(user => ({
      id: user._id,
      name: user.username,
      email: user.email
    }));
});

onMounted(loadData);

// Computed pour filtrer les utilisateurs affichés
const filteredUsers = computed(() => {
  if (!showSearchResults.value) return [];

  let result = allUsers.value;

  // Filtrer par username qui commence par la recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      user.username && user.username.toLowerCase().startsWith(query)
    );
  }

  // Trier : amis d'abord, puis les autres
  return result.sort((a, b) => {
    const aIsFriend = isFriend(a._id);
    const bIsFriend = isFriend(b._id);

    if (aIsFriend && !bIsFriend) return -1;
    if (!aIsFriend && bIsFriend) return 1;
    return 0;
  });
});

function isFriend(userId) {
  return friends.value.some(friend => friend.friendId === userId);
}

async function removeFriend(user) {
  const friendship = friends.value.find(f => f.friendId === user.id);
  if (!friendship) return;

  try {
    await fetch(`/friends/${friendship.id}`, { method: 'DELETE' });
    await loadData();
  } catch (err) {
    console.error('Error removing friend:', err);
  }
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
  loadData();
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

async function onAction(payload) {
  const { item, result } = payload;

  if (result === 'success' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';

      if (isGroupInvite) {
        // Accept group invite
        await fetch(`/user-groups/${item.id}/accept`, { method: 'POST' });
      } else {
        // Accept friend request
        await fetch(`/friends/requests/${item.id}/accept`, { method: 'POST' });
      }

      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error accepting invite:', err);
    }
  } else if (result === 'declined' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';

      if (isGroupInvite) {
        // Decline group invite
        await fetch(`/user-groups/${item.id}/decline`, { method: 'POST' });
      } else {
        // Refuse friend request
        await fetch(`/friends/requests/${item.id}/refuse`, { method: 'POST' });
      }

      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error declining invite:', err);
    }
  } else if (result === 'removed' && item.type === 'friend') {
    try {
      // Delete friend
      await fetch(`/friends/${item.id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  } else if (result === 'left' && item.type === 'group') {
    try {
      // Leave group - remove user from group
      await fetch(`/groups/${item.id}/members/${userId.value}`, { method: 'DELETE' });
      await loadData();
      selectedGroupId.value = null;
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  }
}

function handleGroupClick(group) {
  selectedGroupId.value = group.id;
}

function handleCloseGroup() {
  selectedGroupId.value = null;
}

function handleMemberClick(member) {
  selectedUserId.value = member.id;
}

function handleFriendClick(friend) {
  selectedUserId.value = friend.friendId || friend.id;
}

function handleCloseUserProfile() {
  selectedUserId.value = null;
}

async function handleLeaveGroup(groupData) {
  try {
    await fetch(`/groups/${groupData.id}/members/${userId.value}`, { method: 'DELETE' });
    await loadData();
    selectedGroupId.value = null;
  } catch (err) {
    console.error('Error leaving group:', err);
  }
}

function openCreateGroup() {
  isCreatingGroup.value = true;
}

function closeCreateGroup() {
  isCreatingGroup.value = false;
}

async function handleAddMemberToGroup(groupData) {
  // Charger les membres actuels du groupe
  try {
    const res = await fetch(`/groups/${groupData.id}/members`);
    const data = await res.json();
    currentGroupMembers.value = data.members.map(m => ({
      id: m._id,
      name: m.username
    }));
    isAddingMember.value = true;
  } catch (err) {
    console.error('Error loading group members:', err);
  }
}

function closeAddMember() {
  isAddingMember.value = false;
  currentGroupMembers.value = [];
}

async function handleAddMember(friendUserId) {
  try {
    // Ajouter le membre au groupe avec status pending
    await fetch('/user-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: friendUserId,
        groupId: selectedGroupId.value,
        status: 'pending'
      })
    });

    await loadData();
    isAddingMember.value = false;
    currentGroupMembers.value = [];
  } catch (err) {
    console.error('Error adding member:', err);
  }
}

async function handleCreateGroup(groupData) {
  try {
    // Create the group
    const createRes = await fetch('/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: groupData.name,
        ownerId: userId.value
      })
    });
    const newGroupData = await createRes.json();

    // Add current user to the group
    await fetch('/user-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId.value,
        groupId: newGroupData.group._id,
        status: 'admin'
      })
    });

    // Invite selected friends to the group
    for (const friendId of groupData.memberIds) {
      await fetch('/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: friendId,
          groupId: newGroupData.group._id,
          status: 'pending'
        })
      });
    }

    await loadData();
    isCreatingGroup.value = false;
    tab.value = 'groups';
  } catch (err) {
    console.error('Error creating group:', err);
  }
}

// Send friend invite
async function sendFriendInvite(user) {
  if (sendingInvites.value[user.id]) return;

  sendingInvites.value[user.id] = true;
  try {
    await fetch('/friends/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId.value,
        friendUserId: user.id
      })
    });

    // Reload data to refresh the lists
    await loadData();
  } catch (err) {
    console.error('Error sending friend invite:', err);
  } finally {
    delete sendingInvites.value[user.id];
  }
}
</script>
<template>
  <CreateGroup v-if="isCreatingGroup" :friends="friends" @close="closeCreateGroup" @create="handleCreateGroup" />
  <AddMember v-else-if="isAddingMember" :friends="friends" :current-members="currentGroupMembers"
    @close="closeAddMember" @add="handleAddMember" />
  <UserProfile v-else-if="selectedUserId" :user-id="selectedUserId" @close="handleCloseUserProfile" />
  <v-card v-else-if="loading" class="d-flex justify-center align-center pa-8">
    <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
  </v-card>
  <v-card v-else>
    <v-tabs v-model="tab" direction="horizontal">
      <v-badge v-if="friendInvite.length > 0" inline location="top-right" color="error" :content="friendInvite.length">
        <v-tab prepend-icon="mdi-account" text="Amis" value="friends"></v-tab>
      </v-badge>
      <v-tab v-else prepend-icon="mdi-account" text="Amis" value="friends"></v-tab>
      <v-badge v-if="groupInvite.length > 0" inline location="top-right" color="error" :content="groupInvite.length">
        <v-tab prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab>
      </v-badge>
      <v-tab v-else prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="friends">
        <v-card flat>
          <!-- Zone de recherche -->
          <div ref="searchContainerRef">
            <!-- Search Bar -->
            <v-card-text class="pb-0">
              <TheSearchBar v-model="searchQuery" :show-clear-button="showSearchResults" @focus="onSearchFocus"
                @close="closeSearch" />
            </v-card-text>

            <!-- All Users List when search is active -->
            <v-card-text v-if="showSearchResults" class="pt-6">
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
                    <v-btn v-if="user._id === userId" size="small" variant="text" disabled>
                      Vous
                    </v-btn>
                    <v-btn v-else-if="isFriend(user._id)" size="small" variant="outlined" color="error"
                      @click="removeFriend({ id: user._id, name: user.username })">
                      Supprimer
                    </v-btn>
                    <v-btn v-else size="small" variant="outlined" color="primary" :loading="sendingInvites[user._id]"
                      :disabled="sendingInvites[user._id]"
                      @click="sendFriendInvite({ id: user._id, name: user.username })">
                      Inviter
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="text-center text-grey py-4">
                Aucun utilisateur trouvé
              </div>
            </v-card-text>

            <!-- Friends List when search is not active -->
            <v-card-text v-else>
              <div v-if="friendInvite.length > 0" class="text-subtitle-2 text-grey-darken-1 mb-2">Invitations reçues
              </div>
              <TheListSocials v-if="friendInvite.length > 0" :items="friendInvite" @action="onAction" />
              
              <div v-if="sentPendingRequests.length > 0" class="text-subtitle-2 text-grey-darken-1 mb-2 mt-4">Invitations envoyées (en attente)
              </div>
              <v-list v-if="sentPendingRequests.length > 0" lines="one">
                <v-list-item v-for="request in sentPendingRequests" :key="request.id" :title="request.name">
                  <template v-slot:prepend>
                    <v-avatar color="grey-lighten-1">
                      <v-img v-if="request.profilePicture" :src="request.profilePicture" cover />
                      <span v-else class="text-h6">{{ request.name?.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <template v-slot:append>
                    <v-chip size="small" color="warning" variant="outlined">En attente</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              
              <div v-if="friends.length > 0" class="text-subtitle-2 text-grey-darken-1 mb-2 mt-4">Mes amis
              </div>
              <TheListSocials v-if="friends.length > 0" :items="friends" @action="onAction" />
              
              <div v-if="friendInvite.length === 0 && sentPendingRequests.length === 0 && friends.length === 0" class="text-center text-grey py-4">
                Aucun ami pour le moment
              </div>
            </v-card-text>
          </div>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="groups">
        <v-card flat>
          <UserProfile v-if="selectedUserId && tab === 'groups'" :user-id="selectedUserId"
            @close="handleCloseUserProfile" />
          <TheGroup v-else-if="selectedGroupId" :group-id="selectedGroupId" @close="handleCloseGroup"
            @leave="handleLeaveGroup" @click="handleMemberClick" @add-member="handleAddMemberToGroup" />
          <div v-else>
            <TheListSocials :items="[...groupInvite, ...groups]" @action="onAction" @click="handleGroupClick" />
          </div>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Bouton flottant pour créer un groupe (en dehors des tabs pour éviter l'animation) -->
    <v-btn v-if="tab === 'groups' && !selectedGroupId" icon color="indigo-darken-1" size="x-large" elevation="6"
      style="position: fixed; bottom: 100px; right: 24px; z-index: 10;" @click="openCreateGroup">
      <v-icon color="white" size="large">mdi-plus</v-icon>
    </v-btn>
  </v-card>
</template>
<style scoped></style>
