
const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, ''));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get all stories
router.get('/', async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Create a new story with file upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('BODY:', req.body);
console.log('BODY KEYS:', Object.keys(req.body));
    // Use user object directly (Multer/Express nested parsing), but deep clone to plain object
    const user = JSON.parse(JSON.stringify(req.body.user));
    if (!user || !user.name) {
      return res.status(400).json({ error: 'Missing user name' });
    }
    const description = req.body.description;
    if (!description) {
      return res.status(400).json({ error: 'Missing description field' });
    }
    let image = '';
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    }
    const story = new Story({ user, description, image });
    await story.save();
    res.status(201).json(story);
  } catch (err) {
    console.error('Error creating story:', err);
    res.status(400).json({ error: 'Invalid story data', details: err.message });
  }
});

// Like/unlike a story
router.post('/:id/like', async (req, res) => {
  try {
    const { user } = req.body; // user: username or userId
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (!story.likedBy) story.likedBy = [];
    const idx = story.likedBy.indexOf(user);
    if (idx === -1) {
      story.likedBy.push(user);
      story.likes++;
    } else {
      story.likedBy.splice(idx, 1);
      story.likes--;
    }
    await story.save();
    res.json({ likes: story.likes, liked: idx === -1 });
  } catch (err) {
    res.status(400).json({ error: 'Like error' });
  }
});

// Add a comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { user, text } = req.body;
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    story.comments.push({ user, text });
    await story.save();
    res.json(story.comments);
  } catch (err) {
    res.status(400).json({ error: 'Comment error' });
  }
});

module.exports = router;
