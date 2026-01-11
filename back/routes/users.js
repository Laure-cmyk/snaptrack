import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
} from '../config/cloudinary.js';

const router = express.Router();

// ==========================================
// DÉFINITION DES SCHÉMAS SWAGGER (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "User": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique de l'utilisateur" },
 * "username": { "type": "string", "description": "Nom d'utilisateur" },
 * "email": { "type": "string", "description": "Email" },
 * "profilePicture": { "type": "string", "description": "URL de la photo de profil" },
 * "bio": { "type": "string", "description": "Biographie" },
 * "createdAt": { "type": "string", "format": "date-time" },
 * "updatedAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "UserInput": {
 * "type": "object",
 * "required": ["username", "email", "password"],
 * "properties": {
 * "username": { "type": "string", "example": "john_doe" },
 * "email": { "type": "string", "format": "email", "example": "coucou@coucou.com" },
 * "password": { "type": "string", "format": "password", "example": "123456" },
 * "bio": { "type": "string", "example": "Hello world!" }
 * }
 * },
 * "LoginInput": {
 * "type": "object",
 * "required": ["email", "password"],
 * "properties": {
 * "email": { "type": "string", "description": "Email ou Username", "example": "coucou@coucou.com" },
 * "password": { "type": "string", "format": "password", "example": "123456" }
 * }
 * },
 * "LoginResponse": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "token": { "type": "string", "description": "Token JWT pour l'authentification" },
 * "user": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string" },
 * "username": { "type": "string" },
 * "email": { "type": "string" },
 * "profilePicture": { "type": "string" },
 * "bio": { "type": "string" }
 * }
 * }
 * }
 * }
 * }
 * }
 * }
 */

// ==========================================
// ROUTES
// ==========================================

/**
 * @swagger
 * {
 * "paths": {
 * "/users/login": {
 * "post": {
 * "summary": "Authentification (Login)",
 * "tags": ["Users"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/LoginInput" }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Connexion réussie",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/LoginResponse" }
 * }
 * }
 * },
 * "400": { "description": "Email ou mot de passe manquant" },
 * "401": { "description": "Identifiants invalides" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }]
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/users": {
 * "get": {
 * "summary": "Lister tous les utilisateurs",
 * "tags": ["Users"],
 * "responses": {
 * "200": {
 * "description": "Liste des utilisateurs récupérée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/User" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "post": {
 * "summary": "Créer un nouvel utilisateur (Inscription)",
 * "tags": ["Users"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserInput" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Utilisateur créé",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/User" }
 * }
 * }
 * },
 * "400": { "description": "Données invalides" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/users/{id}": {
 * "get": {
 * "summary": "Récupérer un utilisateur par ID",
 * "tags": ["Users"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "description": "ID de l'utilisateur"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails de l'utilisateur",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/User" }
 * }
 * }
 * },
 * "404": { "description": "Utilisateur introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "put": {
 * "summary": "Mettre à jour un utilisateur",
 * "tags": ["Users"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" }
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "description": "Champs à mettre à jour (partiel)",
 * "example": {
 * "username": "NouveauPseudo",
 * "bio": "Ma nouvelle biographie mise à jour",
 * "email": "nouveau.email@example.com"
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Utilisateur mis à jour",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/User" }
 * }
 * }
 * },
 * "404": { "description": "Utilisateur introuvable" },
 * "400": { "description": "Erreur de validation" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer un utilisateur",
 * "tags": ["Users"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Utilisateur supprimé",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Utilisateur introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate that id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not founded' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Delete profile picture from Cloudinary if exists
    if (user.profilePicture) {
      const publicId = getPublicIdFromUrl(user.profilePicture);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/users/{id}/upload-profile": {
 * "post": {
 * "summary": "Uploader une photo de profil",
 * "tags": ["Users"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "description": "ID de l'utilisateur"
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "multipart/form-data": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "image": {
 * "type": "string",
 * "format": "binary",
 * "description": "Fichier image à uploader"
 * }
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Image uploadée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "profilePicture": { "type": "string", "description": "URL de l'image" }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Aucun fichier fourni" },
 * "404": { "description": "Utilisateur introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.post('/:id/upload-profile', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicture) {
      const oldPublicId = getPublicIdFromUrl(user.profilePicture);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'users');

    // Update user with new profile picture URL
    user.profilePicture = result.url;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: result.url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/users/{id}/profile-picture": {
 * "delete": {
 * "summary": "Supprimer la photo de profil",
 * "tags": ["Users"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "description": "ID de l'utilisateur"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Photo supprimée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Utilisateur introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.delete('/:id/profile-picture', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profilePicture) {
      const publicId = getPublicIdFromUrl(user.profilePicture);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    user.profilePicture = null;
    await user.save();

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
