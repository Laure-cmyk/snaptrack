<template>
    <v-bottom-navigation :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        color="indigo-darken-1" grow fixed>
        <v-btn value="accueil">
            <v-icon>mdi-home</v-icon>
            <span>Accueil</span>
        </v-btn>

        <v-btn value="amis">
            <v-icon>mdi-account-group</v-icon>
            <span>Amis</span>
        </v-btn>

        <v-btn value="creer">
            <v-icon>mdi-plus-circle</v-icon>
            <span>Créer</span>
        </v-btn>

        <v-btn value="profil">
            <v-icon>mdi-account</v-icon>
            <span>Profil</span>
        </v-btn>
    </v-bottom-navigation>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        default: 'accueil'
    }
})

defineEmits(['update:modelValue'])
</script>

<style>
.v-bottom-navigation {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 1000 !important;
}
</style>
