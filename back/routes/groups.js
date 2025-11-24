import express from 'express';
import { Group } from '../models/index.js';

const router = express.Router();

// GET all groups
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().populate('createdBy', 'username email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET group by ID
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

// POST create new group
router.post('/', async (req, res) => {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update group
router.put('/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE group
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
