# Documentation - Module de Création de Parcours

## Vue d'ensemble

Le module de création permet aux utilisateurs de créer, modifier et gérer des parcours avec leurs lieux associés. Le système utilise le localStorage pour la persistance des données et intègre la compression d'images pour optimiser l'espace de stockage.

## Architecture

```
create/
├── PageCreateChallenge.vue    # Orchestrateur principal (page)
├── CreateList.vue             # Liste des parcours créés
├── CreateTrail.vue            # Formulaire de création/édition de parcours
└── CreateLocation.vue         # Formulaire d'ajout de lieu
```

## Flux de navigation

```
1. PageCreateChallenge (liste)
   ├─> CreateList (affichage des parcours)
   │   ├─> Créer nouveau → CreateTrail
   │   └─> Éditer → CreateTrail
   │
   └─> CreateTrail (édition parcours)
       ├─> Ajouter lieu → CreateLocation
       └─> Éditer lieu → Dialog interne
```

## Composants

### PageCreateChallenge.vue

**Rôle** : Orchestrateur principal qui gère l'état global, la navigation entre les vues et la persistance des données.

**État géré** :
- `currentView` : Vue active ('list' | 'parcours' | 'location')
- `myParcours` : Tableau des parcours de l'utilisateur
- `currentParcours` : Parcours en cours d'édition
- `submitting` : État de soumission
- `errorMessage` / `successMessage` : Messages d'état
- `deleteDialog` : Affichage de la confirmation de suppression

**Fonctions principales** :
- `loadMyParcours()` : Charge les parcours depuis localStorage
- `createNewParcours()` : Initialise un nouveau parcours
- `editParcours(parcours)` : Édite un parcours existant
- `saveParcours()` : Sauvegarde avec gestion QuotaExceededError
- `saveLocation(location)` : Ajoute un lieu au parcours actuel
- `deleteParcours()` : Supprime un parcours après confirmation

**Props enfants** :
- Transmet les états de chargement et messages aux composants enfants
- Utilise v-model:parcours pour la synchronisation bi-directionnelle

---

### CreateList.vue

**Rôle** : Affiche la liste des parcours avec état vide et bouton flottant.

**Props** :
- `parcours` (Array, required) : Liste des parcours à afficher

**Events émis** :
- `create-new` : Demande de création d'un nouveau parcours
- `edit` : Demande d'édition d'un parcours (payload: parcours)
- `delete` : Demande de suppression (payload: parcours)

**UI** :
- État vide avec illustration et CTA
- Grille de cards (utilise BaseCard)
- Bouton flottant (FAB) en bas à droite (z-index: 5, bottom: 100px)

**Dépendances** :
- BaseCard : Carte réutilisable avec props showDelete et clickable

---

### CreateTrail.vue

**Rôle** : Formulaire de création/édition de parcours avec gestion des lieux associés.

**Props** :
- `parcours` (Object, required) : Données du parcours
- `loading` (Boolean) : État de chargement
- `errorMessage` (String) : Message d'erreur
- `successMessage` (String) : Message de succès

**Events émis** :
- `update:parcours` : Mise à jour du parcours (v-model)
- `add-location` : Demande d'ajout d'un lieu
- `save` : Sauvegarde du parcours
- `cancel` : Annulation

**État local** :
- `localParcours` : Copie locale synchronisée avec prop
- `editLocationDialog` : État du dialog d'édition de lieu
- `editingLocationIndex` : Index du lieu en cours d'édition
- `editingLocationDescription` : Description en cours d'édition

**Validation** :
- Champs requis : title, description, city
- Au moins 1 lieu requis
- Photo optionnelle (galerie uniquement)

**Fonctions** :
- `openEditLocationDialog(index)` : Ouvre le dialog pour éditer un lieu
- `saveLocationEdit()` : Sauvegarde les modifications d'un lieu
- `confirmDeleteLocation()` : Supprime un lieu du parcours
- `handlePhotoUpload()` : Compression d'image (800x800px, 70%)

**Dialog interne** :
- Modification de l'énigme d'un lieu
- Suppression du lieu
- Actions : Enregistrer / Supprimer / Annuler

---

### CreateLocation.vue

**Rôle** : Formulaire d'ajout d'un nouveau lieu avec photo (caméra), énigme et coordonnées GPS.

**Props** :
- `loading` (Boolean) : État de chargement
- `errorMessage` (String) : Message d'erreur
- `successMessage` (String) : Message de succès

**Events émis** :
- `save` : Sauvegarde du lieu (payload: location)
- `cancel` : Annulation
- `error` : Erreur (payload: message)

**État local** :
- `localLocation` : Données du lieu en cours de création
- `loadingGPS` : État du chargement GPS
- `permissionDialog` : Affichage du dialog de permissions
- `permissionType` : Type de permission demandée ('camera' | 'gps')

**Validation** :
- Champs requis : description (énigme), image, coordinates
- Tout doit être rempli pour activer le bouton

**Gestion des permissions** :
- **Caméra** : Demande via `getUserMedia()` avant ouverture
- **GPS** : Gestion des codes d'erreur (1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT)
- Modal persistante avec bouton "Autoriser l'accès" pour réessayer

**Fonctions** :
- `requestCameraPermission()` : Vérifie et demande permission caméra
- `getCurrentLocation()` : Obtient position GPS (enableHighAccuracy, timeout: 10s)
- `handlePhotoUpload()` : Compression d'image
- `retryPermission()` : Réessaye la permission refusée

**Options GPS** :
```javascript
{
    enableHighAccuracy: true,  // Meilleure précision
    timeout: 10000,            // 10 secondes max
    maximumAge: 0              // Force nouvelle lecture
}
```

---

## Modèle de données

### Parcours

```javascript
{
    id: Number,              // Timestamp de création
    title: String,           // Titre du parcours
    description: String,     // Description
    city: String,            // Ville
    image: String,           // Base64 compressée (optionnel)
    locations: Array,        // Tableau de lieux
    createdAt: String,       // ISO date
    isNew: Boolean          // Flag pour différencier création/édition
}
```

### Lieu

```javascript
{
    id: Number,                  // Timestamp de création
    title: String,               // Titre (non utilisé actuellement)
    description: String,         // Énigme
    image: String,               // Base64 compressée
    coordinates: {
        lat: Number,             // Latitude
        lng: Number,             // Longitude
        accuracy: Number         // Précision en mètres
    }
}
```

---

## Gestion du stockage

### localStorage

**Clé** : `myParcours`
**Format** : JSON stringifié du tableau de parcours

**Limites** :
- ~5-10MB selon navigateur
- Gestion QuotaExceededError dans saveParcours()
- Compression d'images pour optimiser l'espace

### Compression d'images

**Paramètres** :
- Taille maximale : 800x800px
- Qualité : 70%
- Format : Base64 JPEG

**Utilisation** :
```javascript
import { compressImage } from '@/utils/imageCompression'
const compressedImage = await compressImage(file, 800, 800, 0.7)
```

---

## Styles et UI

### Couleurs principales
- **Primaire** : indigo-darken-1 (#3948ab)
- **Fond** : grey-lighten-4
- **Erreur** : red-darken-1
- **Succès** : success (vert Vuetify)

### Espacements
- Padding global : 24px (pa-6)
- Marges entre sections : 24px (mb-6)
- Header sticky : top: 0, z-index: 10

### Composants Vuetify
- v-form : Validation automatique
- v-text-field / v-textarea : variant="outlined", bg-color="grey-lighten-3"
- v-btn : rounded="lg", tailles : x-large / large
- v-dialog : max-width="400-500", rounded="xl"
- v-card : rounded="lg", elevation="2"

---

## Améliorations possibles

### Court terme
1. Afficher la précision GPS (accuracy) pour informer l'utilisateur
2. Permettre plusieurs tentatives GPS pour améliorer la précision
3. Ajouter une carte pour visualiser les lieux
4. Permettre la modification de la photo d'un lieu existant

### Moyen terme
1. Backend pour persistance serveur
2. Partage de parcours entre utilisateurs
3. Export/import de parcours
4. Statistiques de création

### Long terme
1. Mode hors-ligne avec sync
2. Photos multiples par lieu
3. Audio/vidéo pour les énigmes
4. Validation collaborative des lieux

---

## Notes techniques

### Gestion des erreurs
- Erreurs caméra/GPS : Modals avec réessai
- QuotaExceededError : Message utilisateur + rollback
- Compression : Fallback silencieux

### Performance
- Images compressées à la source
- Pas de watch profonds inutiles
- Lazy loading des composants non visibles

### Accessibilité
- Labels explicites sur tous les champs
- Messages d'erreur clairs
- Boutons avec icônes et texte

---

## Maintenance

### Points d'attention
1. Surveiller la taille des images stockées
2. Tester sur différents navigateurs (localStorage)
3. Vérifier les permissions sur mobile
4. Gérer les timeouts GPS en environnement fermé

### Tests recommandés
- [ ] Création de parcours sans photo
- [ ] Édition avec modification de lieux
- [ ] Suppression avec confirmation
- [ ] QuotaExceededError avec nombreuses images
- [ ] Permissions caméra/GPS refusées
- [ ] GPS en intérieur vs extérieur
- [ ] Navigation back/cancel à chaque étape
