import express from 'express';
import { Group, UserGroup, User } from '../models/index.js';

const router = express.Router();

/**
 * 0. GET /groups
 * -> liste de tous les groupes (pour admin / debug)
 */
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().populate('createdBy', 'username email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. Create group
 * POST /groups
 *
 * Body JSON :
 * {
 *   "name": "Team Bleu",
 *   "ownerId": "681ff9a3d2..."  // optionnel
 * }
 *
 * On suppose que dans ton modèle Group, le champ s'appelle "createdBy".
 */
router.post('/', async (req, res) => {
  try {
    const { name, ownerId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le champ "name" est requis' });
    }

    const groupData = { name };

    if (ownerId) {
      groupData.createdBy = ownerId; // mapping ownerId -> createdBy
    }

    const group = await Group.create(groupData);

    res.status(201).json({
      message: 'Group created',
      group: {
        _id: group._id,
        name: group.name,
        ownerId: group.createdBy ?? null,
        createdAt: group.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. List groups (groupes d’un utilisateur)
 *
 * GET /groups/user/:userId
 *
 * Objectif : retourner tous les groupes dans lesquels un utilisateur est associé.
 * On passe par la table de liaison UserGroup (userId, groupId, status).
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. On récupère toutes les liaisons UserGroup pour cet utilisateur
    const userGroups = await UserGroup.find({ userId }).populate('groupId', 'name');

    // 2. On extrait la liste des groupes
    const groups = userGroups
      .filter(ug => ug.groupId) // au cas où un groupe aurait été supprimé
      .map(ug => ({
        _id: ug.groupId._id,
        name: ug.groupId.name
      }));

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Detail group (membres d’un groupe)
 *
 * GET /groups/:groupId/members
 *
 * Objectif : retourner le groupe + la liste des membres.
 */
router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Vérifier que le groupe existe
    const group = await Group.findById(groupId).select('name');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 2. Récupérer les liaisons UserGroup pour ce groupe
    const userGroups = await UserGroup.find({ groupId }).populate('userId', 'username');

    // 3. Construire la liste des membres
    const members = userGroups
      .filter(ug => ug.userId)
      .map(ug => ({
        _id: ug.userId._id,
        username: ug.userId.username
      }));

    res.json({
      groupId: group._id,
      groupName: group.name,
      members
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Update group (modifier le nom du groupe)
 *
 * PUT /groups/:groupId
 *
 * Body JSON :
 * { "name": "Nouveau nom" }
 */
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { name },
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group updated',
      group: {
        _id: group._id,
        name: group.name
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 5. Delete group (supprimer un groupe)
 *
 * DELETE /groups/:groupId
 *
 * On supprime le groupe, et éventuellement toutes les entrées UserGroup associées.
 */
router.delete('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Supprimer aussi les liens UserGroup associés
    await UserGroup.deleteMany({ groupId });

    res.json({
      message: 'Group deleted',
      groupId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Remove user from group (retirer un utilisateur d’un groupe)
 *
 * DELETE /groups/:groupId/members/:userId
 *
 * On supprime l’entrée correspondante dans UserGroup.
 */
router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const deletedLink = await UserGroup.findOneAndDelete({ groupId, userId });

    if (!deletedLink) {
      return res
        .status(404)
        .json({ error: 'User is not a member of this group or relation not found' });
    }

    res.json({
      message: 'User removed from group',
      groupId,
      userId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. GET group by ID classique
 * (si tu en as encore besoin pour d’autres écrans)
 * GET /groups/:id
 *
 * ⚠️ Doit être APRÈS les routes plus spécifiques
 * comme '/:groupId/members' et '/:groupId/members/:userId'.
 */
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('createdBy', 'username email');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
