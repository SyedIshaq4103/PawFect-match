const express = require('express');
const multer = require('multer');
const path = require('path');
const Pet = require('../models/Pet');

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Add Pet
// Require authentication middleware for owner info
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, type, age, gender, description, location } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const owner = req.user.id;
    const pet = new Pet({ name, type, age, gender, description, location, image, owner });
    await pet.save();
    res.status(201).json({ message: 'Pet added successfully', pet });
  } catch (err) {
    res.status(500).json({ error: 'Error adding pet' });
  }
});

// Get Pets with filtering
router.get('/', async (req, res) => {
  try {
    const { type, age, location } = req.query;
    let filter = {};
    if (type) filter.type = new RegExp(type, 'i');
    if (age) filter.age = new RegExp(age, 'i');
    if (location) filter.location = new RegExp(location, 'i');

    console.log('Filter:', filter); // Debugging log

    const pets = await Pet.find(filter).populate('owner', 'username email');
    console.log('Pets found:', pets.length); // Debugging log

    res.json(pets);
  } catch (err) {
    console.error('Error fetching pets:', err); // Debugging log
    res.status(500).json({ error: 'Error fetching pets' });
  }
});

// Get single pet by ID
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('owner', 'username email');
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pet' });
  }
});

module.exports = router;
