const express = require('express');
const router = express.Router();
const StoreHistory = require('../models/StoreHistory');
const authMiddleware = require('../middleware/auth');

// Get all store history
router.get('/', authMiddleware, async (req, res) => {
    try {
        const history = await StoreHistory.find().sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get history for a specific product
router.get('/product/:id', authMiddleware, async (req, res) => {
    try {
        const history = await StoreHistory.find({ productId: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
