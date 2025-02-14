const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdf = require('pdfkit');
const fs = require('fs');
const { exec } = require('child_process');
const User = require('../models/User');
const Event = require('../models/Event');
const Submission = require('../models/Submission');
const Evaluation = require('../models/Evaluation');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Certificate = require('../models/Certificate');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = "your_jwt_secret";

// User Registration
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role });
        await user.save();
        
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        next();
    };
};

// Create Event
router.post('/event/create', authMiddleware, authorizeRoles('organizer', 'admin'), async (req, res) => {
    const { title, description, rules, schedule } = req.body;
    try {
        const event = new Event({ title, description, rules, schedule, organizer: req.user.id });
        await event.save();
        res.json({ msg: 'Event created', event });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Fetch leaderboard
router.get('/leaderboard/:eventId', authMiddleware, async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ eventId: req.params.eventId }).populate('teamId', 'name');
        const leaderboard = evaluations.map(eval => ({ team: eval.teamId.name, score: eval.score })).sort((a, b) => b.score - a.score);
        res.json(leaderboard);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Send Notifications
router.post('/notification/send', authMiddleware, async (req, res) => {
    const { eventId, message } = req.body;
    try {
        const notification = new Notification({ eventId, message });
        await notification.save();
        res.json({ msg: 'Notification sent', notification });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Generate Certificates
router.post('/certificate/generate', authMiddleware, async (req, res) => {
    const { eventId, participantId, type } = req.body;
    try {
        const certificate = new Certificate({ eventId, participantId, type });
        await certificate.save();
        res.json({ msg: 'Certificate generated', certificate });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
