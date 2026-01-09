<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseHeader from '@/components/BaseHeader.vue';
import CreateList from '@/components/create/CreateList.vue';
import CreateTrail from '@/components/create/CreateTrail.vue';
import CreateLocation from '@/components/create/CreateLocation.vue';

// State
const currentView = ref(null); // 'list' | 'trail' | 'location'
const myTrails = ref([]);
const currentTrail = ref(null);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const deleteDialog = ref(false);
const trailToDelete = ref(null);

// Dynamic header title based on the current view
const headerTitle = computed(() => {
  const titles = {
    list: 'Mes parcours',
    location: 'Ajouter un lieu',
    trail: currentTrail.value?.isNew ? 'Créer un parcours' : 'Modifier le parcours'
  };
  return titles[currentView.value] || 'Mes parcours';
});

// Load persisted data when the page is mounted.
onMounted(loadMyTrails);

// Data management
function loadMyTrails() {
  const stored = localStorage.getItem('myTrails');
  if (stored) {
    myTrails.value = JSON.parse(stored);
  }

  currentView.value = myTrails.value.length === 0 ? null : 'list';
  if (myTrails.value.length === 0) {
    createNewTrail();
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('myTrails', JSON.stringify(myTrails.value));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      errorMessage.value =
        'Espace de stockage insuffisant. Vos images sont trop volumineuses. Veuillez en supprimer quelques-unes ou réduire leur taille.';
      return false;
    }
    throw err;
  }
}

// Trail actions
function createNewTrail() {
  currentTrail.value = {
    id: Date.now(),
    title: '',
    description: '',
    city: '',
    image: null,
    locations: [],
    createdAt: new Date().toISOString(),
    isNew: true
  };
  currentView.value = 'trail';
}

function editTrail(trail) {
  currentTrail.value = { ...trail };
  currentView.value = 'trail';
}

function confirmDelete(trail) {
  trailToDelete.value = trail;
  deleteDialog.value = true;
}

function deleteTrail() {
  if (!trailToDelete.value) return;

  myTrails.value = myTrails.value.filter(t => t.id !== trailToDelete.value.id);
  localStorage.setItem('myTrails', JSON.stringify(myTrails.value));
  deleteDialog.value = false;
  trailToDelete.value = null;
}

async function saveTrail() {
  resetMessages();
  submitting.value = true;

  try {
    const isNew = currentTrail.value.isNew;

    if (isNew) {
      currentTrail.value.isNew = false;
      myTrails.value.push(currentTrail.value);
    } else {
      const index = myTrails.value.findIndex(t => t.id === currentTrail.value.id);
      if (index !== -1) {
        myTrails.value[index] = currentTrail.value;
      }
    }

    const saved = saveToLocalStorage();
    if (!saved) {
      if (isNew) myTrails.value.pop(); // Rollback si échec
      return;
    }

    successMessage.value = 'Parcours enregistré avec succès !';
    setTimeout(() => {
      currentView.value = 'list';
      resetMessages();
      currentTrail.value = null;
    }, 1000);
  } catch (err) {
    console.error('Erreur sauvegarde:', err);
    errorMessage.value = "Erreur lors de l'enregistrement du parcours.";
  } finally {
    submitting.value = false;
  }
}

// Location actions
function switchToLocationForm() {
  currentView.value = 'location';
}

function cancelLocationForm() {
  currentView.value = 'trail';
  resetMessages();
}

async function saveLocation(location) {
  resetMessages();
  submitting.value = true;

  try {
    location.id = Date.now();
    currentTrail.value.locations.push(location);
    successMessage.value = 'Lieu ajouté avec succès !';

    setTimeout(() => {
      currentView.value = 'trail';
      successMessage.value = '';
    }, 1000);
  } catch (err) {
    console.error('Erreur ajout lieu:', err);
    errorMessage.value = "Erreur lors de l'ajout du lieu.";
  } finally {
    submitting.value = false;
  }
}

function handleLocationError(error) {
  errorMessage.value = error;
}

// Navigation
function handleBack() {
  if (currentView.value === 'location') {
    cancelLocationForm();
  } else if (currentView.value === 'trail') {
    currentView.value = 'list';
    currentTrail.value = null;
  }
  resetMessages();
}

function resetMessages() {
  errorMessage.value = '';
  successMessage.value = '';
}
</script>

<template>
  <!-- Main Content -->
  <v-main class="bg-grey-lighten-4 main-content">
    <!-- Header avec BaseHeader -->
    <BaseHeader :title="headerTitle" :show-back="currentView !== 'list'" @back="handleBack" />

    <!-- Content Container -->
    <v-container fluid class="px-0 pb-24 pt-6">
      <!-- Liste des trails -->
      <CreateList
        v-if="currentView === 'list'"
        :trails="myTrails"
        @create-new="createNewTrail"
        @edit="editTrail"
        @delete="confirmDelete"
      />

      <!-- Formulaire de trail -->
      <CreateTrail
        v-else-if="currentView === 'trail'"
        v-model:trail="currentTrail"
        :loading="submitting"
        :error-message="errorMessage"
        :success-message="successMessage"
        @add-location="switchToLocationForm"
        @save="saveTrail"
        @cancel="currentView = 'list'"
      />

      <!-- Formulaire de lieu -->
      <CreateLocation
        v-else-if="currentView === 'location'"
        :loading="submitting"
        :error-message="errorMessage"
        :success-message="successMessage"
        @save="saveLocation"
        @cancel="cancelLocationForm"
        @error="handleLocationError"
      />
    </v-container>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="text-h6 font-weight-bold text-center pa-4">
          Supprimer le parcours ?
        </v-card-title>
        <v-card-text class="text-center text-body-1 px-6 py-4">
          Cette action est irréversible. Le parcours "{{ trailToDelete?.title }}" et tous ses lieux
          seront supprimés.
        </v-card-text>
        <v-card-actions class="pa-4 pt-2 flex-column ga-3">
          <v-btn
            block
            color="red-darken-1"
            size="large"
            rounded="lg"
            variant="flat"
            @click="deleteTrail"
          >
            Supprimer
          </v-btn>
          <v-btn
            block
            color="grey-darken-1"
            size="large"
            rounded="lg"
            variant="text"
            @click="deleteDialog = false"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-main>
</template>

<style scoped>
.main-content {
  padding-bottom: 80px;
}
</style>
