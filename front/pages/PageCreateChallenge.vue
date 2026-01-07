<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import BaseHeader from '@/components/BaseHeader.vue'
import CreateList from '@/components/create/CreateList.vue'
import CreateTrail from '@/components/create/CreateTrail.vue'
import CreateLocation from '@/components/create/CreateLocation.vue'

// State
const currentView = ref(null) // 'list' | 'trail' | 'location'
const myTrails = ref([])
const currentTrail = ref(null)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const deleteDialog = ref(false)
const trailToDelete = ref(null)
const loading = ref(true)

// Dynamic header title based on the current view
const headerTitle = computed(() => {
    const titles = {
        list: 'Mes parcours',
        location: 'Ajouter un lieu',
        trail: currentTrail.value?.isNew ? 'Créer un parcours' : 'Modifier le parcours'
    }
    return titles[currentView.value] || 'Mes parcours'
})

// Load data when the page is mounted or activated
onMounted(loadMyTrails)
onActivated(loadMyTrails)

// Get the list of journey IDs created by this user (stored locally)
function getMyJourneyIds() {
    const stored = localStorage.getItem('myJourneyIds')
    return stored ? JSON.parse(stored) : []
}

function saveMyJourneyIds(ids) {
    localStorage.setItem('myJourneyIds', JSON.stringify(ids))
}

// Data management - fetch from API
async function loadMyTrails() {
    loading.value = true
    
    try {
        const myIds = getMyJourneyIds()
        
        if (myIds.length === 0) {
            myTrails.value = []
            currentView.value = null
            createNewTrail()
            return
        }
        
        // Fetch all journeys and filter by IDs we created
        const res = await fetch('/journeys')
        if (!res.ok) throw new Error('Failed to fetch journeys')
        
        const data = await res.json()
        const allJourneys = data.journeys || []
        
        // Filter to only show journeys we created
        myTrails.value = allJourneys
            .filter(j => myIds.includes(j._id))
            .map(j => ({
                id: j._id,
                title: j.name,
                description: j.description,
                city: j.town || '',
                image: j.image,
                locations: [],
                createdAt: j.createdAt
            }))
        
        // Load steps for each journey
        for (const trail of myTrails.value) {
            try {
                const stepsRes = await fetch(`/steps/journey/${trail.id}`)
                if (stepsRes.ok) {
                    const steps = await stepsRes.json()
                    trail.locations = steps.map(s => ({
                        id: s.id,
                        title: `Lieu ${steps.indexOf(s) + 1}`,
                        description: s.riddle || '',
                        image: s.image || null,
                        coordinates: (s.latitude != null && s.longitude != null) ? {
                            lat: s.latitude,
                            lng: s.longitude,
                            accuracy: s.accuracy,
                            altitude: s.altitude,
                            speed: s.speed
                        } : null
                    }))
                }
            } catch (err) {
                console.warn('Failed to load steps for journey:', trail.id)
            }
        }
        
        currentView.value = myTrails.value.length === 0 ? null : 'list'
        if (myTrails.value.length === 0) {
            createNewTrail()
        }
    } catch (err) {
        console.error('Error loading trails:', err)
        errorMessage.value = 'Erreur lors du chargement des parcours.'
        myTrails.value = []
        currentView.value = null
        createNewTrail()
    } finally {
        loading.value = false
    }
}

// Trail actions
function createNewTrail() {
    currentTrail.value = {
        id: null,
        title: '',
        description: '',
        city: '',
        image: null,
        locations: [],
        createdAt: new Date().toISOString(),
        isNew: true
    }
    currentView.value = 'trail'
}

function editTrail(trail) {
    currentTrail.value = { ...trail, isNew: false }
    currentView.value = 'trail'
}

function confirmDelete(trail) {
    trailToDelete.value = trail
    deleteDialog.value = true
}

async function deleteTrail() {
    if (!trailToDelete.value) return
    
    submitting.value = true
    try {
        const res = await fetch(`/journeys/${trailToDelete.value.id}`, {
            method: 'DELETE'
        })
        
        if (!res.ok) throw new Error('Failed to delete journey')
        
        // Remove from local list
        myTrails.value = myTrails.value.filter(t => t.id !== trailToDelete.value.id)
        
        // Remove from stored IDs
        const myIds = getMyJourneyIds().filter(id => id !== trailToDelete.value.id)
        saveMyJourneyIds(myIds)
        
        deleteDialog.value = false
        trailToDelete.value = null
    } catch (err) {
        console.error('Error deleting trail:', err)
        errorMessage.value = 'Erreur lors de la suppression du parcours.'
    } finally {
        submitting.value = false
    }
}

async function saveTrail() {
    resetMessages()
    submitting.value = true

    try {
        const isNew = currentTrail.value.isNew
        
        const journeyData = {
            name: currentTrail.value.title,
            description: currentTrail.value.description,
            town: currentTrail.value.city
        }
        
        let journeyId
        
        if (isNew) {
            // Create new journey
            const res = await fetch('/journeys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(journeyData)
            })
            
            if (!res.ok) throw new Error('Failed to create journey')
            
            const created = await res.json()
            journeyId = created._id
            
            // Store this ID as one of our created journeys
            const myIds = getMyJourneyIds()
            myIds.push(journeyId)
            saveMyJourneyIds(myIds)
        } else {
            // Update existing journey
            journeyId = currentTrail.value.id
            
            const res = await fetch(`/journeys/${journeyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(journeyData)
            })
            
            if (!res.ok) throw new Error('Failed to update journey')
        }
        
        // Upload image if it's a base64 string (new image)
        if (currentTrail.value.image && currentTrail.value.image.startsWith('data:')) {
            try {
                // Convert base64 to blob
                const response = await fetch(currentTrail.value.image)
                const blob = await response.blob()
                
                const formData = new FormData()
                formData.append('image', blob, 'journey-image.jpg')
                
                const uploadRes = await fetch(`/journeys/${journeyId}/upload-image`, {
                    method: 'POST',
                    body: formData
                })
                
                if (!uploadRes.ok) {
                    const errData = await uploadRes.json()
                    console.warn('Image upload failed:', errData)
                }
            } catch (imgErr) {
                console.error('Error uploading image:', imgErr)
            }
        }
        
        // Save steps/locations
        for (let i = 0; i < currentTrail.value.locations.length; i++) {
            const loc = currentTrail.value.locations[i]
            
            // Only create new steps (those without a proper MongoDB ID)
            if (!loc.id || typeof loc.id === 'number') {
                const stepData = {
                    journeyId: journeyId,
                    riddle: loc.description || '',
                    latitude: loc.coordinates?.lat || null,
                    longitude: loc.coordinates?.lng || null,
                    accuracy: loc.coordinates?.accuracy || null,
                    altitude: loc.coordinates?.altitude || null,
                    speed: loc.coordinates?.speed || null
                }
                
                const stepRes = await fetch('/steps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stepData)
                })
                
                if (!stepRes.ok) {
                    const errData = await stepRes.json()
                    console.warn('Step creation failed:', errData)
                } else {
                    // Upload step image if exists
                    if (loc.image && loc.image.startsWith('data:')) {
                        const stepResult = await stepRes.json()
                        try {
                            const imgResponse = await fetch(loc.image)
                            const blob = await imgResponse.blob()
                            
                            const formData = new FormData()
                            formData.append('image', blob, 'step-image.jpg')
                            
                            await fetch(`/steps/${stepResult.step.id}/upload-image`, {
                                method: 'POST',
                                body: formData
                            })
                        } catch (imgErr) {
                            console.warn('Step image upload failed:', imgErr)
                        }
                    }
                }
            }
        }

        successMessage.value = 'Parcours enregistré avec succès !'
        setTimeout(async () => {
            await loadMyTrails()
            currentView.value = 'list'
            resetMessages()
            currentTrail.value = null
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
    currentView.value = 'trail'
    resetMessages()
}

async function saveLocation(location) {
    resetMessages()
    submitting.value = true

    try {
        // Clone the location data to avoid reference issues
        const newLocation = {
            id: Date.now(),
            title: location.title || '',
            description: location.description || '',
            image: location.image || null,
            coordinates: location.coordinates ? {
                lat: location.coordinates.lat,
                lng: location.coordinates.lng,
                accuracy: location.coordinates.accuracy,
                altitude: location.coordinates.altitude,
                speed: location.coordinates.speed
            } : null
        }
        currentTrail.value.locations.push(newLocation)
        successMessage.value = 'Lieu ajouté avec succès !'

        setTimeout(() => {
            currentView.value = 'trail'
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

// Delete a location/step from the database
async function deleteLocation(location) {
    // Only delete from DB if it has a MongoDB ID (string, not number)
    if (location.id && typeof location.id === 'string') {
        try {
            const res = await fetch(`/steps/${location.id}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                console.warn('Failed to delete step from DB')
            }
        } catch (err) {
            console.error('Error deleting step:', err)
        }
    }
}

// Navigation
function handleBack() {
    if (currentView.value === 'location') {
        cancelLocationForm()
    } else if (currentView.value === 'trail') {
        currentView.value = 'list'
        currentTrail.value = null
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
        <!-- Header avec BaseHeader -->
        <BaseHeader :title="headerTitle" :show-back="currentView !== 'list'" @back="handleBack" />

        <!-- Content Container -->
        <v-container fluid class="px-0 pb-24 pt-6">
            <!-- Loading State -->
            <div v-if="loading" class="d-flex justify-center align-center py-16">
                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            </div>
            
            <!-- Liste des trails -->
            <CreateList v-else-if="currentView === 'list'" :trails="myTrails" @create-new="createNewTrail" @edit="editTrail"
                @delete="confirmDelete" />

            <!-- Formulaire de trail -->
            <CreateTrail v-else-if="currentView === 'trail'" v-model:trail="currentTrail" :loading="submitting"
                :error-message="errorMessage" :success-message="successMessage" @add-location="switchToLocationForm"
                @save="saveTrail" @cancel="currentView = 'list'" @delete-location="deleteLocation" />

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
                    Cette action est irréversible. Le parcours "{{ trailToDelete?.title }}" et tous ses lieux seront
                    supprimés.
                </v-card-text>
                <v-card-actions class="pa-4 pt-2 flex-column ga-3">
                    <v-btn block color="red-darken-1" size="large" rounded="lg" variant="flat" @click="deleteTrail">
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
</style>