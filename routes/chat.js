const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { authenticate } = require('../middleware/auth');

// Get chat messages between two users
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const userId = req.params.userId;
        const currentUserId = req.user.id;

        const messages = await Chat.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a new message
router.post('/', authenticate, async (req, res) => {
    try {
        const { receiver, content } = req.body;
        const sender = req.user.id;

        const newMessage = new Chat({ sender, receiver, content });
        await newMessage.save();

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get all users the current user has messaged
router.get('/users', authenticate, async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Find distinct users the current user has messaged or received messages from
        const users = await Chat.aggregate([
            { $match: { $or: [
                { sender: currentUserId },
                { receiver: currentUserId }
            ] } },
            { $group: { _id: null, userIds: { $addToSet: { $cond: [
                { $eq: ["$sender", currentUserId] }, "$receiver", "$sender"
            ] } } } },
            { $unwind: "$userIds" },
            { $lookup: {
                from: "users",
                localField: "userIds",
                foreignField: "_id",
                as: "userDetails"
            } },
            { $unwind: "$userDetails" },
            { $replaceRoot: { newRoot: "$userDetails" } }
        ]);

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
