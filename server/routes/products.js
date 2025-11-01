import express from 'express';
import DatabaseService from '../services/DatabaseService.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const rows = await DatabaseService.all(`
            SELECT * FROM products 
            ORDER BY created_at DESC
        `);
        
        const products = rows.map(row => Product.fromDatabase(row).toJSON());
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const row = await DatabaseService.get(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        
        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = Product.fromDatabase(row).toJSON();
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
    try {
        const { sku, name, description, price, costPrice, stockQuantity } = req.body;
        
        // Validation
        if (!sku || !name || !price) {
            return res.status(400).json({ 
                error: 'SKU, name, and price are required' 
            });
        }

        const product = new Product(
            null, sku, name, description, price, costPrice, stockQuantity
        );

        // Check if SKU already exists
        const existingProduct = await DatabaseService.get(
            'SELECT id FROM products WHERE sku = ?',
            [sku]
        );
        
        if (existingProduct) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        // Save to database
        await DatabaseService.run(
            `INSERT INTO products (id, sku, name, description, price, cost_price, stock_quantity, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                product.id, product.sku, product.name, product.description,
                product.price, product.costPrice, product.stockQuantity,
                product.createdAt, product.updatedAt
            ]
        );

        res.status(201).json(product.toJSON());
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, costPrice, stockQuantity } = req.body;
        
        const product = await DatabaseService.get(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await DatabaseService.run(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, cost_price = ?, stock_quantity = ?, updated_at = ?
             WHERE id = ?`,
            [
                name || product.name,
                description || product.description,
                price || product.price,
                costPrice || product.cost_price,
                stockQuantity !== undefined ? stockQuantity : product.stock_quantity,
                new Date(),
                req.params.id
            ]
        );

        // Return updated product
        const updatedProduct = await DatabaseService.get(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        
        res.json(Product.fromDatabase(updatedProduct).toJSON());
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
    try {
        const result = await DatabaseService.run(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

export default router;