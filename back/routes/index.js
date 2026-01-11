import express from 'express';

const router = express.Router();

/**
 * @swagger
 * {
 * "tags": [
 * {
 * "name": "General",
 * "description": "Routes générales de l'API"
 * }
 * ],
 * "paths": {
 * "/": {
 * "get": {
 * "summary": "Test de connexion (Ignition)",
 * "description": "Route racine permettant de vérifier si le serveur API est bien démarré.",
 * "tags": ["General"],
 * "responses": {
 * "200": {
 * "description": "Le serveur est en ligne",
 * "content": {
 * "text/plain": {
 * "schema": {
 * "type": "string",
 * "example": "Ignition!"
 * }
 * }
 * }
 * },
 * "500": {
 * "description": "Erreur serveur interne"
 * }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/', function (req, res, next) {
  res.send('Ignition!');
});

export default router;
