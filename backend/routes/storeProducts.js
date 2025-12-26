const express = require('express');
const router = express.Router();
const StoreProduct = require('../models/StoreProduct');
const StoreHistory = require('../models/StoreHistory');
const authMiddleware = require('../middleware/auth');

// Get all store products
router.get('/', authMiddleware, async (req, res) => {
    try {
        const products = await StoreProduct.find().sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new store product
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, costPrice, quantity, unitsPerBag, barcode, category, notes } = req.body;

        // Validation
        if (!name || quantity === undefined || quantity === '') {
            return res.status(400).json({
                success: false,
                message: 'Name and quantity are required'
            });
        }

        const upb = Number(unitsPerBag) || 1;
        const initialBags = Number(quantity);
        const totalKg = initialBags * upb;

        const product = new StoreProduct({
            name,
            costPrice,
            quantity: totalKg,
            unitsPerBag: upb,
            barcode: barcode || '',
            category: category || '',
            notes: notes || ''
        });

        await product.save();

        // Log initial stock as history (as bags)
        if (initialBags > 0) {
            const history = new StoreHistory({
                productId: product._id,
                productName: product.name,
                type: 'add',
                quantity: initialBags,
                adjustmentType: 'bags',
                unitsPerBag: upb,
                totalQuantityAdjusted: totalKg,
                costPrice: product.costPrice,
                notes: 'Initial stock'
            });
            await history.save();
        }

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update store product
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, costPrice, quantity, unitsPerBag, barcode, category, notes } = req.body;

        // For updates, we expect the total kg to be passed or handled
        // If the user is editing the product details, we keep the existing quantity (total kg)
        // unless they explicitly want to change it.
        // However, the frontend for editing currently allows editing the quantity.
        // We should ensure consistency. If editing, quantity passed is total kg.

        const product = await StoreProduct.findByIdAndUpdate(
            req.params.id,
            {
                name,
                costPrice,
                quantity: Number(quantity),
                unitsPerBag: Number(unitsPerBag) || 1,
                barcode,
                category,
                notes
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete store product
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await StoreProduct.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Search store products
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.json({ success: true, data: [] });
        }

        const products = await StoreProduct.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { barcode: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        });

        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Adjust stock (add/deduct)
router.post('/:id/adjust', authMiddleware, async (req, res) => {
    try {
        const { type, quantity, adjustmentType, notes } = req.body;
        const product = await StoreProduct.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const qty = Number(quantity);
        const upb = Number(product.unitsPerBag) || 1;
        const unitsToAdjust = adjustmentType === 'bags' ? qty * upb : qty;

        if (isNaN(unitsToAdjust)) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        if (type === 'deduct' && product.quantity < unitsToAdjust) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Required: ${unitsToAdjust.toFixed(2)}kg, Available: ${product.quantity.toFixed(2)}kg`
            });
        }

        const newQuantity = type === 'add'
            ? product.quantity + unitsToAdjust
            : product.quantity - unitsToAdjust;

        product.quantity = newQuantity;
        await product.save();

        const history = new StoreHistory({
            productId: product._id,
            productName: product.name,
            type,
            quantity: qty,
            adjustmentType,
            unitsPerBag: upb,
            totalQuantityAdjusted: unitsToAdjust,
            costPrice: product.costPrice,
            notes: notes || ''
        });
        await history.save();

        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
