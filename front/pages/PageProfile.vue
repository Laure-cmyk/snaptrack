<script setup>
import { ref } from 'vue'
import BaseHeader from '@/components/BaseHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import { compressImage } from '@/utils/imageCompression'
import avatarDefault from '@/assets/avatar.jpeg'

// State
const user = ref({
    pseudo: 'JohnDoe',
    email: 'john.doe@example.com',
    profileImage: null
})

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

async function handlePhotoUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
        const compressedImage = await compressImage(file, 400, 400, 0.8)
        user.value.profileImage = compressedImage
    } catch (err) {
        console.error('Erreur compression image:', err)
    }
}

function removePhoto() {
    user.value.profileImage = null
}

// Password functions
async function changePassword() {
    passwordError.value = ''
    passwordSuccess.value = ''
    submittingPassword.value = true

    try {
        // TODO: Appel API
        await new Promise(resolve => setTimeout(resolve, 1000))

        passwordSuccess.value = 'Mot de passe modifié avec succès !'
        setTimeout(() => {
            passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
            passwordError.value = ''
            passwordSuccess.value = ''
            expansionPanel.value = [] // Fermer le panel
        }, 2000)
    } catch (err) {
        passwordError.value = 'Erreur lors du changement de mot de passe.'
    } finally {
        submittingPassword.value = false
    }
}

// Account actions
function logout() {
    localStorage.removeItem('jwt')
    logoutDialog.value = false
    window.location.href = '/authentification'
}

function deleteAccount() {
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

        <!-- Content -->
        <v-container fluid class="px-6 py-8 pb-24">
            <!-- Photo de profil -->
            <div class="text-center mb-8">
                <input ref="photoInput" type="file" accept="image/*" style="display: none"
                    @change="handlePhotoUpload" />

                <div class="position-relative d-inline-block">
                    <!-- Avatar -->
                    <v-avatar size="120" class="mb-4" style="cursor: pointer;" @click="triggerPhotoUpload">
                        <v-img :src="user.profileImage || avatarDefault" cover />
                    </v-avatar>

                    <!-- Edit button -->
                    <v-btn icon size="small" color="indigo-darken-1" class="position-absolute"
                        style="bottom: 16px; right: 0;" @click="triggerPhotoUpload">
                        <v-icon size="small">mdi-camera</v-icon>
                    </v-btn>
                </div>

                <!-- Remove photo button -->
                <div v-if="user.profileImage" class="mt-2">
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
                        <div class="text-caption text-grey-darken-1 mb-1">Pseudo</div>
                        <div class="text-body-1 font-weight-medium">{{ user.pseudo }}</div>
                    </div>

                    <!-- Email -->
                    <div>
                        <div class="text-caption text-grey-darken-1 mb-1">Email</div>
                        <div class="text-body-1 font-weight-medium">{{ user.email }}</div>
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
    background-color: white !important;
}

.password-panel-title {
    background-color: white !important;
}

.password-panel-text {
    background-color: white !important;
}

:deep(.v-expansion-panel__shadow) {
    box-shadow: none !important;
}

:deep(.v-expansion-panel-title__overlay) {
    display: none !important;
}
</style>
