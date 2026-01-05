import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { upload, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

// POST login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
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

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT change password
router.put('/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE remove profile picture
router.delete('/:id/profile-picture', async (req, res) => {
  try {
    console.log('🗑️ Removing profile picture for user:', req.params.id);
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete image from Cloudinary if exists
    if (user.profilePicture) {
      console.log('🗑️ Deleting from Cloudinary...');
      const oldPublicId = user.profilePicture.split('/').slice(-1)[0].split('.')[0];
      const deleteResult = await cloudinary.uploader.destroy(`snaptrack/${oldPublicId}`);
      console.log('🗑️ Delete result:', deleteResult);
    }

    user.profilePicture = null;
    await user.save();
    console.log('🗑️ Profile picture removed successfully');

    res.json({ message: 'Profile picture removed successfully' });
  } catch (error) {
    console.error('🗑️ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST upload profile picture
router.post('/:id/upload-profile', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 ====== PROFILE PICTURE UPLOAD START ======');
    console.log('📸 Step 1: Request received for user:', req.params.id);
    console.log('📸 Step 2: File received:', req.file ? 'Yes ✅' : 'No ❌');
    
    if (!req.file) {
      console.log('📸 Error: No file in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('📸 Step 3: File details:');
    console.log('  - Original name:', req.file.originalname);
    console.log('  - Mime type:', req.file.mimetype);
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - Buffer length:', req.file.buffer?.length, 'bytes');

    console.log('📸 Step 4: Finding user in database...');
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('📸 Error: User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('📸 Step 4: User found:', user.username);

    // Delete old image from Cloudinary if exists
    if (user.profilePicture) {
      console.log('📸 Step 5: Deleting old profile picture...');
      try {
        const oldPublicId = user.profilePicture.split('/').slice(-1)[0].split('.')[0];
        console.log('  - Old public ID:', `snaptrack/${oldPublicId}`);
        const deleteResult = await cloudinary.uploader.destroy(`snaptrack/${oldPublicId}`);
        console.log('  - Delete result:', deleteResult);
      } catch (deleteErr) {
        console.warn('📸 Warning: Failed to delete old image:', deleteErr.message);
      }
    } else {
      console.log('📸 Step 5: No existing profile picture to delete');
    }

    // Upload new image to Cloudinary
    console.log('📸 Step 6: Uploading to Cloudinary...');
    
    // Convert buffer to base64 data URI
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    console.log('  - Base64 string created, length:', base64Image.length);
    
    console.log('📸 Step 7: Calling cloudinary.uploader.upload...');
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'snaptrack',
      resource_type: 'image',
      overwrite: true,
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    });
    
    console.log('📸 Step 8: Upload successful! ✅');
    console.log('  - Public ID:', uploadResult.public_id);
    console.log('  - Secure URL:', uploadResult.secure_url);
    console.log('  - Format:', uploadResult.format);
    console.log('  - Size:', uploadResult.bytes, 'bytes');

    // Update user with new Cloudinary URL
    console.log('📸 Step 9: Saving to database...');
    user.profilePicture = uploadResult.secure_url;
    await user.save();
    console.log('📸 Step 9: Database updated ✅');

    console.log('📸 ====== PROFILE PICTURE UPLOAD COMPLETE ======');
    
    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('📸 ❌ Upload error:', error);
    console.error('📸 Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

export default router;
