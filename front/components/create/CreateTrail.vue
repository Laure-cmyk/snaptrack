<script setup>
import { ref, computed, watch } from 'vue'
import { compressImage } from '@/utils/imageCompression'

// Props & Emits
const props = defineProps({
    trail: { type: Object, required: true },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    successMessage: { type: String, default: '' }
})

const emit = defineEmits(['update:trail', 'add-location', 'save', 'cancel', 'delete-location'])

// Refs (local state)
const form = ref(null)
const valid = ref(false)
const photoInput = ref(null)
const localTrail = ref({ ...props.trail })
const editLocationDialog = ref(false)
const editingLocationIndex = ref(null)
const editingLocationDescription = ref('')

// Determine if we are editing an existing trail
const isEditing = computed(() => !localTrail.value.isNew)
const canSave = computed(() =>
    valid.value &&
    localTrail.value.title &&
    localTrail.value.description &&
    localTrail.value.city &&
    localTrail.value.locations.length > 0
)

// Form Validation Rules
const rules = {
    required: value => !!value || 'Ce champ est requis'
}

// Watch for prop changes to update localTrail
watch(() => props.trail, (newVal) => {
    localTrail.value = { ...newVal }
}, { deep: true })

// Photo functions
function triggerPhotoUpload() {
    photoInput.value.click()
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
        const compressedImage = await compressImage(file, 800, 800, 0.7)
        localTrail.value.image = compressedImage
        emitUpdate()
    } catch (err) {
        console.error('Erreur compression image:', err)
    }
}

function removePhoto() {
    localTrail.value.image = null
    emitUpdate()
}

// Location edit functions
function openEditLocationDialog(index) {
    editingLocationIndex.value = index
    editingLocationDescription.value = localTrail.value.locations[index].description
    editLocationDialog.value = true
}

function saveLocationEdit() {
    if (editingLocationIndex.value !== null && editingLocationDescription.value.trim()) {
        localTrail.value.locations[editingLocationIndex.value].description = editingLocationDescription.value.trim()
        emitUpdate()
    }
    closeEditDialog()
}

function confirmDeleteLocation() {
    if (editingLocationIndex.value !== null) {
        const locationToDelete = localTrail.value.locations[editingLocationIndex.value]
        emit('delete-location', locationToDelete)
        localTrail.value.locations.splice(editingLocationIndex.value, 1)
        emitUpdate()
    }
    closeEditDialog()
}

function closeEditDialog() {
    editLocationDialog.value = false
    editingLocationIndex.value = null
    editingLocationDescription.value = ''
}

function emitUpdate() {
    emit('update:trail', localTrail.value)
}
</script>

<template>
    <v-form ref="form" v-model="valid" class="pa-6 bg-grey-lighten-4">
        <!-- Photo Upload -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Photo du parcours</div>
        <div class="mb-8">
            <input ref="photoInput" type="file" accept="image/*" style="display: none" @change="handlePhotoUpload" />

            <!-- Photo Field -->
            <div v-if="!localTrail.image" class="photo-field bg-grey-lighten-3 d-flex align-center justify-center"
                @click="triggerPhotoUpload"
                style="cursor: pointer; min-height: 120px; border-radius: 8px; border: 1px solid #E0E0E0;">
                <div class="text-center">
                    <v-icon size="40" color="grey-darken-1">mdi-image</v-icon>
                    <div class="text-body-2 text-grey-darken-1 mt-2">Ajouter une photo</div>
                </div>
            </div>

            <!-- Preview with Delete -->
            <div v-else class="position-relative">
                <v-img :src="localTrail.image" height="200" cover style="border-radius: 8px;" />
                <v-btn icon size="small" class="position-absolute"
                    style="top: 12px; right: 12px; background-color: rgba(0, 0, 0, 0.5);" @click="removePhoto">
                    <v-icon color="white" size="small">mdi-close</v-icon>
                </v-btn>
            </div>
        </div>

        <!-- Trail Title -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Titre du parcours</div>
        <v-text-field v-model="localTrail.title" placeholder="Donnez un titre accrocheur" variant="outlined"
            density="comfortable" :rules="[rules.required]" class="mb-2" bg-color="grey-lighten-3"
            @update:model-value="emitUpdate" />

        <!-- Trail Description -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Description</div>
        <v-textarea v-model="localTrail.description" placeholder="Décrivez votre parcours en quelques mots"
            variant="outlined" rows="3" :rules="[rules.required]" class="mb-2" bg-color="grey-lighten-3"
            @update:model-value="emitUpdate" />

        <!-- City -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Ville</div>
        <v-text-field v-model="localTrail.city" placeholder="Nom de la ville" variant="outlined" density="comfortable"
            :rules="[rules.required]" class="mb-4" bg-color="grey-lighten-3" @update:model-value="emitUpdate" />

        <!-- Locations Section -->
        <div class="text-subtitle-1 font-weight-bold mb-2">Lieux du parcours</div>

        <!-- Empty State -->
        <div v-if="localTrail.locations.length === 0" class="text-center py-6 mb-6 bg-grey-lighten-3"
            style="border-radius: 8px; border: 1px solid #E0E0E0;">
            <v-icon size="48" color="grey">mdi-map-marker-off</v-icon>
            <div class="text-body-2 text-grey mt-2">Aucun lieu ajouté</div>
        </div>

        <!-- Locations List -->
        <v-list v-else class="mb-6 pa-0" style="border-radius: 8px;">
            <v-list-item v-for="(location, index) in localTrail.locations" :key="location.id" class="px-4 py-3 bg-white"
                style="border-radius: 8px; border: 1px solid #E0E0E0; cursor: pointer;"
                @click="openEditLocationDialog(index)">
                <template v-slot:prepend>
                    <v-avatar size="60" style="border-radius: 8px;" class="mr-3">
                        <v-img v-if="location.image" :src="location.image" cover />
                        <v-icon v-else size="30" color="grey">mdi-image-outline</v-icon>
                    </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold mb-1">
                    {{ location.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption location-description">
                    {{ location.description }}
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <!-- Add Location Button -->
        <v-btn block size="large" variant="outlined" color="indigo-darken-1" prepend-icon="mdi-plus"
            @click="$emit('add-location')" class="mb-6">
            Ajouter un lieu
        </v-btn>

        <!-- Error Alert -->
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-6">
            {{ errorMessage }}
        </v-alert>

        <!-- Success Alert -->
        <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-6">
            {{ successMessage }}
        </v-alert>

        <!-- Action Buttons -->
        <div class="d-flex flex-column ga-2 mt-12">
            <v-btn block color="indigo-darken-1" size="x-large" rounded="lg" elevation="2" variant="flat"
                :disabled="!canSave" :loading="loading" @click="$emit('save')">
                {{ isEditing ? 'Modifier' : 'Créer le parcours' }}
            </v-btn>

            <v-btn v-if="!localTrail.isNew" block color="grey-darken-1" size="large" rounded="lg" variant="text"
                @click="$emit('cancel')">
                Annuler
            </v-btn>
        </div>

        <!-- Edit Location Dialog -->
        <v-dialog v-model="editLocationDialog" max-width="500">
            <v-card rounded="xl" class="pa-4">
                <v-card-title class="text-h6 font-weight-bold text-center pa-4">
                    Modifier le lieu
                </v-card-title>
                <v-card-text class="px-6 py-4">
                    <div class="text-subtitle-1 font-weight-bold mb-2">Énigme</div>
                    <v-textarea v-model="editingLocationDescription" placeholder="Modifiez l'énigme" variant="outlined"
                        rows="3" bg-color="grey-lighten-3" />
                </v-card-text>
                <v-card-actions class="pa-4 pt-2 flex-column ga-3">
                    <v-btn block color="indigo-darken-1" size="large" rounded="lg" variant="flat"
                        @click="saveLocationEdit">
                        Enregistrer
                    </v-btn>
                    <v-btn block color="red-darken-1" size="large" rounded="lg" variant="outlined"
                        @click="confirmDeleteLocation">
                        Supprimer ce lieu
                    </v-btn>
                    <v-btn block color="grey-darken-1" size="large" rounded="lg" variant="text"
                        @click="editLocationDialog = false">
                        Annuler
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-form>
</template>

<style scoped>
.location-description {
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
}
</style>
