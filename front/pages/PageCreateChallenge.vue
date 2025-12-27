<script setup>
import { ref, computed, onMounted } from 'vue'
import CreateList from '@/components/create/CreateList.vue'
import CreateTrail from '@/components/create/CreateTrail.vue'
import CreateLocation from '@/components/create/CreateLocation.vue'

// State
const currentView = ref(null) // 'list' | 'parcours' | 'location'
const myParcours = ref([])
const currentParcours = ref(null)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const deleteDialog = ref(false)
const parcoursToDelete = ref(null)

// Computed
const headerTitle = computed(() => {
    const titles = {
        list: 'Mes parcours',
        location: 'Ajouter un lieu',
        parcours: currentParcours.value?.isNew ? 'Créer un parcours' : 'Modifier le parcours'
    }
    return titles[currentView.value] || 'Mes parcours'
})

// Lifecycle
onMounted(loadMyParcours)

// Data management
function loadMyParcours() {
    const stored = localStorage.getItem('myParcours')
    if (stored) {
        myParcours.value = JSON.parse(stored)
    }

    currentView.value = myParcours.value.length === 0 ? null : 'list'
    if (myParcours.value.length === 0) {
        createNewParcours()
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('myParcours', JSON.stringify(myParcours.value))
        return true
    } catch (err) {
        if (err.name === 'QuotaExceededError') {
            errorMessage.value = 'Espace de stockage insuffisant. Vos images sont trop volumineuses. Veuillez en supprimer quelques-unes ou réduire leur taille.'
            return false
        }
        throw err
    }
}

// Parcours actions
function createNewParcours() {
    currentParcours.value = {
        id: Date.now(),
        title: '',
        description: '',
        city: '',
        image: null,
        locations: [],
        createdAt: new Date().toISOString(),
        isNew: true
    }
    currentView.value = 'parcours'
}

function editParcours(parcours) {
    currentParcours.value = { ...parcours }
    currentView.value = 'parcours'
}

function confirmDelete(parcours) {
    parcoursToDelete.value = parcours
    deleteDialog.value = true
}

function deleteParcours() {
    if (!parcoursToDelete.value) return

    myParcours.value = myParcours.value.filter(p => p.id !== parcoursToDelete.value.id)
    localStorage.setItem('myParcours', JSON.stringify(myParcours.value))
    deleteDialog.value = false
    parcoursToDelete.value = null
}

async function saveParcours() {
    resetMessages()
    submitting.value = true

    try {
        const isNew = currentParcours.value.isNew

        if (isNew) {
            currentParcours.value.isNew = false
            myParcours.value.push(currentParcours.value)
        } else {
            const index = myParcours.value.findIndex(p => p.id === currentParcours.value.id)
            if (index !== -1) {
                myParcours.value[index] = currentParcours.value
            }
        }

        const saved = saveToLocalStorage()
        if (!saved) {
            if (isNew) myParcours.value.pop() // Rollback si échec
            return
        }

        successMessage.value = 'Parcours enregistré avec succès !'
        setTimeout(() => {
            currentView.value = 'list'
            resetMessages()
            currentParcours.value = null
        }, 1000)
    } catch (err) {
        console.error('Erreur sauvegarde:', err)
        errorMessage.value = 'Erreur lors de l\'enregistrement du parcours.'
    } finally {
        submitting.value = false
    }
}

// Location actions
function switchToLocationForm() {
    currentView.value = 'location'
}

function cancelLocationForm() {
    currentView.value = 'parcours'
    resetMessages()
}

async function saveLocation(location) {
    resetMessages()
    submitting.value = true

    try {
        location.id = Date.now()
        currentParcours.value.locations.push(location)
        successMessage.value = 'Lieu ajouté avec succès !'

        setTimeout(() => {
            currentView.value = 'parcours'
            successMessage.value = ''
        }, 1000)
    } catch (err) {
        console.error('Erreur ajout lieu:', err)
        errorMessage.value = 'Erreur lors de l\'ajout du lieu.'
    } finally {
        submitting.value = false
    }
}

function handleLocationError(error) {
    errorMessage.value = error
}

// Navigation
function handleBack() {
    if (currentView.value === 'location') {
        cancelLocationForm()
    } else if (currentView.value === 'parcours') {
        currentView.value = 'list'
        currentParcours.value = null
    }
    resetMessages()
}

function resetMessages() {
    errorMessage.value = ''
    successMessage.value = ''
}
</script>

<template>
    <!-- Main Content -->
    <v-main class="bg-grey-lighten-4 main-content">
        <!-- Header Section -->
        <div class="header-section" style="position: sticky; top: 0; z-index: 10;">
            <div class="pa-6 pt-10 d-flex align-center justify-center position-relative">
                <v-btn v-if="currentView !== 'list'" icon variant="text" @click="handleBack" class="position-absolute"
                    style="left: 24px;">
                    <v-icon color="white">mdi-close</v-icon>
                </v-btn>
                <div class="text-center">
                    <div class="text-h5 font-weight-bold text-white">{{ headerTitle }}</div>
                </div>
            </div>
        </div>

        <!-- Content Container -->
        <v-container fluid class="px-0 pb-24 pt-6">
            <!-- Liste des parcours -->
            <CreateList v-if="currentView === 'list'" :parcours="myParcours" @create-new="createNewParcours"
                @edit="editParcours" @delete="confirmDelete" />

            <!-- Formulaire de parcours -->
            <CreateTrail v-else-if="currentView === 'parcours'" v-model:parcours="currentParcours" :loading="submitting"
                :error-message="errorMessage" :success-message="successMessage" @add-location="switchToLocationForm"
                @save="saveParcours" @cancel="currentView = 'list'" />

            <!-- Formulaire de lieu -->
            <CreateLocation v-else-if="currentView === 'location'" :loading="submitting" :error-message="errorMessage"
                :success-message="successMessage" @save="saveLocation" @cancel="cancelLocationForm"
                @error="handleLocationError" />
        </v-container>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
            <v-card rounded="xl" class="pa-4">
                <v-card-title class="text-h6 font-weight-bold text-center pa-4">
                    Supprimer le parcours ?
                </v-card-title>
                <v-card-text class="text-center text-body-1 px-6 py-4">
                    Cette action est irréversible. Le parcours "{{ parcoursToDelete?.title }}" et tous ses lieux seront
                    supprimés.
                </v-card-text>
                <v-card-actions class="pa-4 pt-2 flex-column ga-3">
                    <v-btn block color="red-darken-1" size="large" rounded="lg" variant="flat" @click="deleteParcours">
                        Supprimer
                    </v-btn>
                    <v-btn block color="grey-darken-1" size="large" rounded="lg" variant="text"
                        @click="deleteDialog = false">
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

.header-section {
    background: linear-gradient(135deg, #3948ab 0%, #3948ab 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
