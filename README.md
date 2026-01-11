# SnapTrack
🔗 [Lien vers l'application et l'API](https://snaptrack-nd9h.onrender.com/)
---
## Installation
Cloner le repo :
```
git clone <repository-url>
cd snaptrack
```
Installer les dépendances et initialiser la base de donnée :
```
npm install
npm run seed
```
Créer un fichier .env à la racine du projet avec la configuration suivante :
```
PORT = 10000
VITE_WS_URL=ws://localhost:443
```
## Lancement
---
Lancer MongoDB :
```
brew services start mongodb-community@8.0
```
Lancer en local :
```
npm run dev
```
Arrêter MongoDB
```
brew services stop mongodb-community@8.0
```
## Build & déployement
--- 
Pour le build local, lancez :
```
npm run build
```
Une branche dédiée à la production a été créée pour Render :
```
git checkout test-Prod
git push
```
## Troubleshooting
---
Une erreur commune après avoir lancé **npm run dev** est :
```
/your-path-to-the-project/snaptrack/node_modules/rollup/dist/native.js:83
throw new Error
```
Il suffit de d'interrompre et les commandes suivantes :
```
cd snaptrack
rm -rf node_modules package-lock.json
npm install
```
Puis relancez ! 

