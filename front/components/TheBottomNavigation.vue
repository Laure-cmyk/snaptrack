<template>
    <v-bottom-navigation color="indigo-darken-1" grow fixed>
        <v-btn to="/" value="accueil">
            <v-icon>mdi-home</v-icon>
            <span>Accueil</span>
        </v-btn>

        <v-btn to="/friendlist" value="amis">
            <v-icon>mdi-account-group</v-icon>
            <span>Amis</span>
        </v-btn>

        <v-btn to="/createchallenge" value="creer">
            <v-icon>mdi-plus-circle</v-icon>
            <span>Créer</span>
        </v-btn>

        <v-btn to="/profil" value="profil">
            <v-icon>mdi-account</v-icon>
            <span>Profil</span>
        </v-btn>
    </v-bottom-navigation>
</template>

<script setup>
</script>

<style>
.v-bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}
</style>
