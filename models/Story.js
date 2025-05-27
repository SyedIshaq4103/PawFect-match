const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: String, required: true }, // username or userId
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String },
  adopted: { type: String }
}, { _id: false });

const storySchema = new mongoose.Schema({
  user: { type: userSchema, required: true },
  description: { type: String, required: true },
  image: { type: String }, // URL or path
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // array of usernames or userIds
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', storySchema);
