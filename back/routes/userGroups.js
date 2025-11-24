import express from 'express';
import { UserGroup } from '../models/index.js';

const router = express.Router();

// GET all user-group relationships
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

// GET user-group by ID
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

// POST create new user-group relationship
router.post('/', async (req, res) => {
  try {
    const userGroup = await UserGroup.create(req.body);
    res.status(201).json(userGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update user-group relationship
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

// DELETE user-group relationship
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
