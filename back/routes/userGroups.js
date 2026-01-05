import express from 'express';
import { UserGroup, User, Group } from '../models/index.js';

const router = express.Router();

/**
 * 0. GET /user-groups
 * -> liste brute de toutes les relations user–group (pour admin/debug)
 */
router.get('/', async (req, res) => {
  try {
    const userGroups = await UserGroup.find()
      .populate('userId', 'username email')
      .populate('groupId', 'name description');
    res.json(userGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. List Group Members (avec statut)
 * GET /user-groups/members/:groupId
 *
 * Objectif : renvoyer le groupe + la liste des membres + leur statut
 *
 * Réponse :
 * {
 *   "groupId": "...",
 *   "groupName": "Team Bleu",
 *   "members": [
 *     { "userId": "...", "username": "Alice", "status": "admin" },
 *     ...
 *   ]
 * }
 *
 * ⚠️ IMPORTANT : cette route doit être DÉCLARÉE
 * AVANT le `router.get('/:id')` sinon `/members/...` sera pris comme un :id.
 */
router.get('/members/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Chercher toutes les relations UserGroup pour ce groupe
    const userGroups = await UserGroup.find({ groupId })
      .populate('userId', 'username email')
      .populate('groupId', 'name');

    // 2. Si aucun UserGroup mais que le groupe existe quand même,
    // on va chercher le groupe pour renvoyer un groupName + liste vide.
    let group = null;

    if (userGroups.length > 0) {
      group = userGroups[0].groupId; // déjà peuplé
    } else {
      group = await Group.findById(groupId).select('name');
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
    }

    // 3. Construire la liste des membres avec leur statut
    const members = userGroups.map((ug) => ({
      userId: ug.userId._id,
      username: ug.userId.username,
      status: ug.status, // ex: admin, member, pending...
    }));

    // 4. Réponse structurée
    res.json({
      groupId: groupId,
      groupName: group.name,
      members,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1b. List pending group invitations for a user
 * GET /user-groups/pending/:userId
 *
 * Objectif : renvoyer les invitations de groupe en attente pour un utilisateur
 */
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const pendingInvites = await UserGroup.find({
      userId,
      status: 'pending',
    }).populate('groupId', 'name');

    const result = pendingInvites
      .filter((ug) => ug.groupId)
      .map((ug) => ({
        inviteId: ug._id,
        groupId: ug.groupId._id,
        groupName: ug.groupId.name,
        status: ug.status,
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1c. Accept group invitation
 * POST /user-groups/:id/accept
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndUpdate(
      req.params.id,
      { status: 'member' },
      { new: true }
    ).populate('groupId', 'name');

    if (!userGroup) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({
      message: 'Group invitation accepted',
      userGroup: {
        id: userGroup._id,
        groupId: userGroup.groupId._id,
        groupName: userGroup.groupId.name,
        status: userGroup.status,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 1d. Refuse group invitation
 * POST /user-groups/:id/refuse
 */
router.post('/:id/refuse', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndDelete(req.params.id);

    if (!userGroup) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({
      message: 'Group invitation refused',
      id: req.params.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. GET user-group by ID
 * GET /user-groups/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const userGroup = await UserGroup.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('groupId', 'name description');
    if (!userGroup) {
      return res.status(404).json({ error: 'UserGroup not found' });
    }
    res.json(userGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. POST create new user-group relationship
 * POST /user-groups
 * Body :
 * {
 *   "userId": "...",
 *   "groupId": "...",
 *   "status": "member" // ou "admin", "pending", etc.
 * }
 */
router.post('/', async (req, res) => {
  try {
    const userGroup = await UserGroup.create(req.body);
    res.status(201).json(userGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 4. PUT update user-group relationship
 * PUT /user-groups/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!userGroup) {
      return res.status(404).json({ error: 'UserGroup not found' });
    }
    res.json(userGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 5. DELETE user-group relationship
 * DELETE /user-groups/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndDelete(req.params.id);
    if (!userGroup) {
      return res.status(404).json({ error: 'UserGroup not found' });
    }
    res.json({ message: 'UserGroup deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
