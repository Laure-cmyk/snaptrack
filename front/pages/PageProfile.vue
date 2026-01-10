<script setup>
import { ref, onMounted, onActivated } from 'vue'
import BaseHeader from '@/components/BaseHeader.vue'
import BaseModal from '@/components/BaseModal.vue'

// State
const loading = ref(true)
const userId = ref(null)
const user = ref({
    username: '',
    email: '',
    bio: '',
    profilePicture: null
})

const uploadingPhoto = ref(false)
const editingBio = ref(false)
const bioForm = ref('')
const savingBio = ref(false)

const photoInput = ref(null)
const expansionPanel = ref([])
const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})
const passwordValid = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')
const submittingPassword = ref(false)
const deleteAccountDialog = ref(false)
const logoutDialog = ref(false)

// Load user data from the logged-in user
async function loadUserData() {
    loading.value = true

    try {
        // Get the logged-in user from localStorage
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
            console.warn('No logged-in user found')
            loading.value = false
            return
        }

        const loggedInUser = JSON.parse(storedUser)
        const loggedInUserId = loggedInUser.id || loggedInUser._id

        if (!loggedInUserId) {
            console.warn('No user ID in stored user data')
            loading.value = false
            return
        }

        // Fetch the specific user from the API
        const res = await fetch(`/users/${loggedInUserId}`)

        if (!res.ok) {
            console.warn('API returned:', res.status)
            // Fallback to localStorage data
            userId.value = loggedInUserId
            user.value = {
                username: loggedInUser.username || '',
                email: loggedInUser.email || '',
                bio: loggedInUser.bio || '',
                profilePicture: loggedInUser.profilePicture || null
            }
            loading.value = false
            return
        }

        const data = await res.json()
        userId.value = data._id
        user.value = {
            username: data.username,
            email: data.email,
            bio: data.bio || '',
            profilePicture: data.profilePicture
        }
    } catch (err) {
        console.error('Error loading user:', err)
    } finally {
        loading.value = false
    }
}

// Load on mount and when navigating back to page
onMounted(loadUserData)
onActivated(loadUserData)

// Validation rules
const passwordRules = {
    required: value => !!value || 'Ce champ est requis',
    minLength: value => value.length >= 8 || 'Au moins 8 caractères',
    match: value => value === passwordForm.value.newPassword || 'Les mots de passe ne correspondent pas'
}

// Photo functions
function triggerPhotoUpload() {
    photoInput.value.click()
}

// Bio functions
function startEditingBio() {
    bioForm.value = user.value.bio
    editingBio.value = true
}

function cancelEditingBio() {
    bioForm.value = ''
    editingBio.value = false
}

async function saveBio() {
    if (!userId.value) return

    savingBio.value = true
    try {
        const res = await fetch(`/users/${userId.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio: bioForm.value })
        })

        if (res.ok) {
            const data = await res.json()
            user.value.bio = data.bio || bioForm.value
            editingBio.value = false
            bioForm.value = ''
        } else {
            console.error('Error saving bio:', res.status)
        }
    } catch (err) {
        console.error('Error saving bio:', err)
    } finally {
        savingBio.value = false
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0]
    if (!file || !userId.value) return

    uploadingPhoto.value = true
    try {
        const formData = new FormData()
        formData.append('image', file)

        const res = await fetch(`/users/${userId.value}/upload-profile`, {
            method: 'POST',
            body: formData
        })
        const data = await res.json()

        if (res.ok) {
            user.value.profilePicture = data.profilePicture
        }
    } catch (err) {
        console.error('Error uploading photo:', err)
    } finally {
        uploadingPhoto.value = false
    }
}

async function removePhoto() {
    if (!userId.value) return

    try {
        const res = await fetch(`/users/${userId.value}/profile-picture`, {
            method: 'DELETE'
        })

        if (res.ok) {
            user.value.profilePicture = null
        }
    } catch (err) {
        console.error('Error removing photo:', err)
    }
}

// Password functions
async function changePassword() {
    passwordError.value = ''
    passwordSuccess.value = ''
    submittingPassword.value = true

    try {
        const res = await fetch(`/users/${userId.value}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: passwordForm.value.currentPassword,
                newPassword: passwordForm.value.newPassword
            })
        })

        const data = await res.json()

        if (!res.ok) {
            passwordError.value = data.error || 'Erreur lors du changement de mot de passe.'
            return
        }

        passwordSuccess.value = 'Mot de passe modifié avec succès !'
        setTimeout(() => {
            passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
            passwordError.value = ''
            passwordSuccess.value = ''
            expansionPanel.value = []
        }, 2000)
    } catch (err) {
        passwordError.value = err.message || 'Erreur lors du changement de mot de passe.'
    } finally {
        submittingPassword.value = false
    }
}

// Account actions
function logout() {
    localStorage.removeItem('jwt')
    localStorage.removeItem('user')
    logoutDialog.value = false
    window.location.href = '/authentification'
}

async function deleteAccount() {
    try {
        if (userId.value) {
            await fetch(`/users/${userId.value}`, { method: 'DELETE' })
        }
    } catch (err) {
        console.error('Error deleting account:', err)
    }

    localStorage.removeItem('jwt')
    localStorage.removeItem('myTrails')
    localStorage.removeItem('user')
    deleteAccountDialog.value = false
    window.location.href = '/authentification'
}
</script>

<template>
    <v-main class="bg-grey-lighten-4">
        <!-- Header -->
        <BaseHeader title="Profil" :show-back="false" />

        <!-- Loading State -->
        <v-container v-if="loading" fluid class="d-flex justify-center align-center py-16">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        </v-container>

        <!-- Content -->
        <v-container v-else fluid class="px-6 py-8 pb-24">
            <!-- Photo de profil -->
            <div class="text-center mb-8">
                <input ref="photoInput" type="file" accept="image/*" style="display: none"
                    @change="handlePhotoUpload" />

                <div class="position-relative d-inline-block">
                    <!-- Avatar -->
                    <v-avatar size="120" class="mb-4" style="cursor: pointer;" @click="triggerPhotoUpload"
                        color="grey-lighten-1">
                        <v-progress-circular v-if="uploadingPhoto" indeterminate color="white"
                            size="40"></v-progress-circular>
                        <v-img v-else-if="user.profilePicture" :src="user.profilePicture" cover />
                        <span v-else class="text-h3">{{ user.username?.charAt(0).toUpperCase() }}</span>
                    </v-avatar>

                    <!-- Edit button -->
                    <v-btn icon size="small" color="indigo-darken-1" class="position-absolute"
                        style="bottom: 16px; right: 0;" @click="triggerPhotoUpload" :loading="uploadingPhoto">
                        <v-icon size="small">mdi-camera</v-icon>
                    </v-btn>
                </div>

                <!-- Remove photo button -->
                <div v-if="user.profilePicture" class="mt-2">
                    <v-btn size="small" variant="text" color="grey-darken-1" @click="removePhoto">
                        Supprimer la photo
                    </v-btn>
                </div>
            </div>

            <!-- Informations personnelles -->
            <div class="text-subtitle-1 font-weight-bold mb-2">Informations personnelles</div>
            <v-card rounded="lg" elevation="0" class="mb-6" style="background-color: white;">
                <v-card-text class="pa-4">
                    <!-- Pseudo -->
                    <div class="mb-4">
                        <div class="text-caption text-grey-darken-1 mb-1">Nom d'utilisateur</div>
                        <div class="text-body-1 font-weight-medium">{{ user.username }}</div>
                    </div>

                    <!-- Email -->
                    <div class="mb-4">
                        <div class="text-caption text-grey-darken-1 mb-1">Email</div>
                        <div class="text-body-1 font-weight-medium">{{ user.email }}</div>
                    </div>

                    <!-- Bio -->
                    <div>
                        <div class="text-caption text-grey-darken-1 mb-1">Bio</div>

                        <!-- Vue en lecture -->
                        <div v-if="!editingBio" class="d-flex align-start justify-space-between ga-2">
                            <div class="text-body-1 flex-grow-1">
                                {{ user.bio || 'Aucune bio' }}
                            </div>
                            <v-btn icon size="x-small" variant="text" color="indigo-darken-1" @click="startEditingBio"
                                class="flex-shrink-0">
                                <v-icon size="small">mdi-pencil</v-icon>
                            </v-btn>
                        </div>

                        <!-- Vue en édition -->
                        <div v-else>
                            <v-textarea v-model="bioForm" variant="outlined" density="comfortable"
                                placeholder="Décris-toi en quelques mots..." rows="3" counter="150" maxlength="150"
                                bg-color="grey-lighten-4" class="mb-2" />
                            <div class="d-flex ga-2">
                                <v-btn size="small" color="indigo-darken-1" :loading="savingBio" @click="saveBio">
                                    Enregistrer
                                </v-btn>
                                <v-btn size="small" variant="outlined" @click="cancelEditingBio">
                                    Annuler
                                </v-btn>
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <!-- Sécurité -->
            <div class="text-subtitle-1 font-weight-bold mb-2">Sécurité</div>
            <v-expansion-panels v-model="expansionPanel" class="mb-12">
                <v-expansion-panel rounded="lg" elevation="0" class="password-panel">
                    <v-expansion-panel-title class="password-panel-title">
                        <span class="font-weight-medium">Modifier le mot de passe</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text class="password-panel-text">
                        <v-form v-model="passwordValid" class="mt-2">
                            <div class="text-subtitle-2 font-weight-bold mb-2">Mot de passe actuel</div>
                            <v-text-field v-model="passwordForm.currentPassword" type="password" variant="outlined"
                                density="comfortable" :rules="[passwordRules.required]" class="mb-3"
                                bg-color="grey-lighten-4" />

                            <div class="text-subtitle-2 font-weight-bold mb-2">Nouveau mot de passe</div>
                            <v-text-field v-model="passwordForm.newPassword" type="password" variant="outlined"
                                density="comfortable" :rules="[passwordRules.required, passwordRules.minLength]"
                                class="mb-3" bg-color="grey-lighten-4" />

                            <div class="text-subtitle-2 font-weight-bold mb-2">Confirmer le mot de passe</div>
                            <v-text-field v-model="passwordForm.confirmPassword" type="password" variant="outlined"
                                density="comfortable" :rules="[passwordRules.required, passwordRules.match]"
                                class="mb-3" bg-color="grey-lighten-4" />

                            <!-- Error Alert -->
                            <v-alert v-if="passwordError" type="error" variant="tonal" class="mb-3">
                                {{ passwordError }}
                            </v-alert>

                            <!-- Success Alert -->
                            <v-alert v-if="passwordSuccess" type="success" variant="tonal" class="mb-3">
                                {{ passwordSuccess }}
                            </v-alert>

                            <v-btn block color="indigo-darken-1" size="large" :disabled="!passwordValid"
                                :loading="submittingPassword" @click="changePassword">
                                Modifier le mot de passe
                            </v-btn>
                        </v-form>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <!-- Actions -->
            <div class="d-flex flex-column ga-3">
                <v-btn block size="large" variant="outlined" color="grey-darken-1" prepend-icon="mdi-logout"
                    rounded="lg" @click="logoutDialog = true">
                    Se déconnecter
                </v-btn>

                <v-btn block size="large" variant="outlined" color="red-darken-1" prepend-icon="mdi-delete" rounded="lg"
                    @click="deleteAccountDialog = true">
                    Supprimer le compte
                </v-btn>
            </div>
        </v-container>

        <!-- Logout Confirmation Dialog -->
        <BaseModal v-model="logoutDialog" title="Se déconnecter ?" confirm-text="Se déconnecter" cancel-text="Annuler"
            confirm-color="indigo-darken-1" @confirm="logout" @cancel="logoutDialog = false">
            Êtes-vous sûr de vouloir vous déconnecter ?
        </BaseModal>

        <!-- Delete Account Confirmation Dialog -->
        <BaseModal v-model="deleteAccountDialog" title="Supprimer le compte ?" confirm-text="Supprimer"
            cancel-text="Annuler" confirm-color="red-darken-1" @confirm="deleteAccount"
            @cancel="deleteAccountDialog = false">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
        </BaseModal>
    </v-main>
</template>

<style scoped>
.password-panel {
    background-color: white;
    overflow: hidden;
}

.password-panel-title {
    background-color: white;
}

.password-panel-text {
    background-color: white;
}

:deep(.v-expansion-panel__shadow) {
    box-shadow: none;
}

:deep(.v-expansion-panel-title__overlay) {
    display: none;
}

:deep(.v-expansion-panel-text__wrapper) {
    border-radius: 0 0 12px 12px;
}
</style>
