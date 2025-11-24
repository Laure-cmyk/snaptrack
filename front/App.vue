<script setup>
import { ref } from 'vue';

const appTitle = ref('SnapTrack');
const description = ref('Track the spot where the snapshot was taken!');

// Function to fetch all users from database
const pokeDatabase = async () => {
  try {
    console.log('Contact DB');

    const response = await fetch('/api/users');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const users = await response.json();
    console.log('👥 All Users from Database:', users);
    console.log(`📊 Total users found: ${users.length}`);
    
    // Display each user in detail
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Bio:', user.bio || 'No bio');
      console.log('Created:', user.createdAt);
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  }
};
</script>

<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>{{ appTitle }}</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card class="mt-5">
              <v-card-title class="text-h3 text-center">
                {{ appTitle }}
              </v-card-title>
              <v-card-subtitle class="text-h6 text-center">
                {{ description }}
              </v-card-subtitle>
              <v-card-text>
                <p class="text-body-1">
                  SnapTrack is a web application that uses real-time geolocation to track
                  the routes used by challengers to find specific spots from photos. 
                  Challenge your friends or compete with others to find hidden locations!
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>


      
        <v-row justify="center" class="mt-5">
            <v-col cols="auto">
            <v-btn color="secondary" @click="pokeDatabase">
                Poke Database
            </v-btn>
            </v-col>
        </v-row>

    </v-main>

    <v-footer color="primary" app>
      <v-row justify="center">
        <v-col cols="auto">
          <span class="white--text">
            &copy; 2025 SnapTrack - Track your adventures!
          </span>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<style scoped>
.v-card-title {
  word-break: break-word;
}
</style>
