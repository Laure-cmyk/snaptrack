<script setup>
import { ref, computed } from 'vue';

/*  */

const props = defineProps({
  friends: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'create']);

const groupName = ref('');
const selectedFriends = ref([]);
const isCreating = ref(false);

const isValid = computed(() => {
  return (
    groupName.value.trim().length > 0 &&
    selectedFriends.value.length >= 1 &&
    selectedFriends.value.length <= 3
  );
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
    await new Promise(resolve => setTimeout(resolve, 200));
    /* API */
    emit('create', {
      name: groupName.value.trim(),
      memberIds: selectedFriends.value
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
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-btn icon="mdi-arrow-left" variant="text" @click="emit('close')" class="mr-2"></v-btn>
      Créer un groupe
    </v-card-title>

    <v-card-text>
      <v-text-field
        v-model="groupName"
        label="Nom du groupe"
        placeholder="Entrez le nom du groupe"
        variant="outlined"
        :disabled="isCreating"
        class="mb-4"
      ></v-text-field>

      <v-divider class="mb-4"></v-divider>

      <div class="text-subtitle-2 mb-2">
        Sélectionner des amis ({{ selectedFriends.length }} / 3)
      </div>

      <v-alert v-if="friends.length === 0" type="info" variant="tonal" class="mb-4">
        Vous n'avez pas encore d'amis. Ajoutez-en pour créer un groupe.
      </v-alert>

      <v-list v-else lines="two">
        <v-list-item
          v-for="friend in friends"
          :key="friend.id"
          :title="friend.name"
          @click="() => toggleFriend(friend.id)"
          :disabled="isCreating || (!isFriendSelected(friend.id) && selectedFriends.length >= 3)"
        >
          <template v-slot:prepend>
            <v-list-item-action start>
              <v-checkbox
                :model-value="isFriendSelected(friend.id)"
                :disabled="
                  isCreating || (!isFriendSelected(friend.id) && selectedFriends.length >= 3)
                "
                @click.stop="() => toggleFriend(friend.id)"
              ></v-checkbox>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>

      <v-alert v-if="!isValid && errorMessage" type="warning" variant="tonal" class="mt-4">
        {{ errorMessage }}
      </v-alert>
    </v-card-text>

    <v-card-actions class="justify-center">
      <v-btn
        color="primary"
        variant="elevated"
        :disabled="!isValid || isCreating"
        :loading="isCreating"
        @click="handleCreate"
      >
        Créer le groupe
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
