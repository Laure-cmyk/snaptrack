<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseHeader from '@/components/BaseHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import ChallengeLocationCard from '@/components/challenge/ChallengeLocationCard.vue'
import successImage from '@/assets/success.png'
import failImage from '@/assets/fail.png'
import victoryImage from '@/assets/victory.png'

const router = useRouter()
const route = useRoute()

// État
const currentLocationIndex = ref(0)
const quitDialog = ref(false)
const successDialog = ref(false)
const errorDialog = ref(false)
const completeDialog = ref(false)
const rating = ref(0)

// TODO: Récupérer les données du parcours depuis l'API
// Pour l'instant, données de démonstration
const trail = ref({
    id: route.params.id || 1,
    title: 'Parcours des Toilettes',
    locations: [
        {
            id: 1,
            title: 'La Fontaine Pestalozzi',
            description: 'Je suis un éducateur célèbre, et ma fontaine se trouve sur la place principale. Qui suis-je ?',
            image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80',
            latitude: 46.7785,
            longitude: 6.6411
        },
        {
            id: 2,
            title: 'Le Château',
            description: 'Bâti au 13ème siècle, je domine la ville. Quel est mon nom ?',
            image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80',
            latitude: 46.7790,
            longitude: 6.6420
        },
        {
            id: 3,
            title: 'Les Bains Thermaux',
            description: 'Mes eaux chaudes sont connues depuis l\'époque romaine. Où suis-je ?',
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            latitude: 46.7780,
            longitude: 6.6400
        }
    ]
})

// Fonctions
function goBack() {
    quitDialog.value = true
}

function addLocation() {
    // TODO: Vérifier la localisation GPS réelle
    // Pour l'instant, simulation avec 80% de réussite
    const isLocationCorrect = Math.random() > 0.2

    if (isLocationCorrect) {
        successDialog.value = true

        setTimeout(() => {
            successDialog.value = false
            if (currentLocationIndex.value < trail.value.locations.length - 1) {
                currentLocationIndex.value++
            } else {
                // Challenge terminé
                completeDialog.value = true
            }
        }, 2000)
    } else {
        errorDialog.value = true
    }
}

function quitChallenge() {
    quitDialog.value = false
    router.back()
}

function completeChallenge() {
    // TODO: Enregistrer la completion du challenge et la note
    console.log('Note attribuée:', rating.value)
    completeDialog.value = false
    router.push('/')
}
</script>

<template>
    <v-main class="bg-grey-lighten-4">
        <!-- Header -->
        <BaseHeader title="Challenge" :show-back="true" @back="goBack" />

        <!-- Content -->
        <v-container fluid class="px-6 py-8 pb-24">
            <!-- Location Card -->
            <ChallengeLocationCard v-if="currentLocationIndex < trail.locations.length"
                :location="trail.locations[currentLocationIndex]" :current-index="currentLocationIndex"
                :total-locations="trail.locations.length" @add-location="addLocation" @quit="quitDialog = true" />

            <!-- Message si tous les lieux sont complétés -->
            <v-card v-else rounded="lg" elevation="2" class="pa-6 text-center">
                <v-icon size="80" color="green">mdi-check-circle</v-icon>
                <h2 class="text-h5 font-weight-bold mt-4 mb-2">Félicitations !</h2>
                <p class="text-body-1">Vous avez complété tous les lieux du parcours.</p>
            </v-card>
        </v-container>

        <!-- Quit Confirmation Dialog -->
        <BaseModal v-model="quitDialog" title="Quitter le challenge ?" confirm-text="Quitter" cancel-text="Annuler"
            confirm-color="red-darken-1" @confirm="quitChallenge" @cancel="quitDialog = false">
            Êtes-vous sûr de vouloir quitter ? Votre progression ne sera pas sauvegardée.
        </BaseModal>

        <!-- Success Dialog -->
        <BaseModal v-model="successDialog" title="Bravo !" :cancel-text="''" :confirm-text="''">
            <div class="text-center">
                <img :src="successImage" alt="Success" style="width: 120px; height: auto; margin: 0 auto;" />
                <h3 class="text-h6 font-weight-bold mt-4 mb-2">Félicitations !</h3>
                <p class="text-body-2">Vous avez trouvé le lieu correct ! L'énigme a été résolue avec succès.</p>
            </div>
        </BaseModal>

        <!-- Error Dialog -->
        <BaseModal v-model="errorDialog" title="Oups !" confirm-text="Réessayer" :cancel-text="''"
            confirm-color="indigo-darken-1" @confirm="errorDialog = false">
            <div class="text-center">
                <img :src="failImage" alt="Fail" style="width: 120px; height: auto; margin: 0 auto;" />
                <h3 class="text-h6 font-weight-bold mt-4 mb-2">Localisation incorrecte</h3>
                <p class="text-body-2">Vous n'êtes pas au bon endroit. Relisez l'énigme et déplacez-vous vers le lieu
                    correct.</p>
            </div>
        </BaseModal>

        <!-- Complete Challenge Dialog -->
        <BaseModal v-model="completeDialog" title="Challenge terminé !" confirm-text="Retour à l'accueil"
            :cancel-text="''" confirm-color="indigo-darken-1" @confirm="completeChallenge">
            <div class="text-center">
                <img :src="victoryImage" alt="Victory" style="width: 120px; height: auto; margin: 0 auto;" />
                <h3 class="text-h6 font-weight-bold mt-4 mb-3">Félicitations !</h3>
                <p class="text-body-2 mb-4">Vous avez terminé le parcours avec succès ! Tous les lieux ont été
                    découverts.
                </p>

                <!-- Rating -->
                <div class="mt-6">
                    <p class="text-subtitle-2 font-weight-bold mb-3">Notez ce parcours :</p>
                    <v-rating v-model="rating" color="yellow-darken-2" active-color="yellow-darken-2" size="large"
                        hover />
                </div>
            </div>
        </BaseModal>
    </v-main>
</template>

<style scoped></style>
