import express from 'express';
import DatabaseService from '../services/DatabaseService.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

// Debug route to check all invoices and their status
router.get('/debug/all', async (req, res) => {
    try {
        const invoices = await DatabaseService.all(`
            SELECT id, invoice_number, status, total_amount, issued_at, payment_method
            FROM invoices 
            ORDER BY issued_at DESC
        `);
        
        console.log('=== INVOICE DEBUG INFO ===');
        invoices.forEach(inv => {
            console.log(`Invoice: ${inv.invoice_number}, Status: ${inv.status}, Total: ${inv.total_amount}, Payment: ${inv.payment_method}`);
        });
        
        res.json({
            message: 'Check server console for invoice details',
            invoices: invoices
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/invoices - Get all invoices
router.get('/', async (req, res) => {
    try {
        const invoices = await DatabaseService.all(`
            SELECT i.*, 
                   COUNT(ili.id) as items_count
            FROM invoices i
            LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
            GROUP BY i.id
            ORDER BY i.issued_at DESC
        `);
        
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// GET /api/invoices/:id - Get single invoice with line items
router.get('/:id', async (req, res) => {
    try {
        const invoice = await DatabaseService.get(
            'SELECT * FROM invoices WHERE id = ?',
            [req.params.id]
        );
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const lineItems = await DatabaseService.all(`
            SELECT ili.*, p.sku, p.name as product_name
            FROM invoice_line_items ili
            LEFT JOIN products p ON ili.product_id = p.id
            WHERE ili.invoice_id = ?
        `, [req.params.id]);

        res.json({
            ...invoice,
            lineItems: lineItems
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// POST /api/invoices - Create new invoice
router.post('/', async (req, res) => {
    let transactionSuccess = false;

    try {
        const { customerName, lineItems, notes, paymentMethod } = req.body;
        
        if (!lineItems || lineItems.length === 0) {
            return res.status(400).json({ error: 'Invoice must have at least one line item' });
        }

        // Start transaction logic
        const invoice = new Invoice();
        const now = new Date();
        invoice.issuedAt = now.toISOString();
        invoice.customerName = customerName || 'Walk-in Customer';
        invoice.notes = notes || '';
        invoice.paymentMethod = paymentMethod || 'cash';

        // Get invoice count for numbering
        const countResult = await DatabaseService.get('SELECT COUNT(*) as count FROM invoices');
        invoice.generateInvoiceNumber(countResult.count);

        // Validate stock and prepare line items
        for (const item of lineItems) {
            const product = await DatabaseService.get(
                'SELECT * FROM products WHERE id = ?',
                [item.productId]
            );
            
            if (!product) {
                return res.status(404).json({ error: `Product ${item.productId} not found` });
            }

            if (product.stock_quantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
                });
            }

            invoice.addLineItem({
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                stockQuantity: product.stock_quantity
            }, item.quantity);
        }

        // Mark as paid if payment method provided
        if (paymentMethod) {
            invoice.markAsPaid(paymentMethod);
        }

        // Save invoice to database
        await DatabaseService.run(
            `INSERT INTO invoices (id, invoice_number, customer_name, status, subtotal, tax_rate, tax_amount, total_amount, issued_at, notes, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice.id, invoice.invoiceNumber, invoice.customerName, invoice.status,
                parseFloat(invoice.subtotal.toFixed(2)), invoice.taxRate, parseFloat(invoice.taxAmount.toFixed(2)), parseFloat(invoice.totalAmount.toFixed(2)),
                invoice.issuedAt, invoice.notes, invoice.paymentMethod
            ]
        );

        // Save line items and update product stock
        for (const item of invoice.lineItems) {
            await DatabaseService.run(
                `INSERT INTO invoice_line_items (id, invoice_id, product_id, quantity, unit_price, line_total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [item.id, invoice.id, item.productId, item.quantity, item.unitPrice, item.lineTotal]
            );

            // Update product stock
            await DatabaseService.run(
                'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?',
                [item.quantity, new Date(), item.productId]
            );
        }

        transactionSuccess = true;
        res.status(201).json(invoice.toJSON());

    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Failed to create invoice: ' + error.message });
    }
});

// GET /api/invoices/stats/revenue - Get revenue statistics
router.get('/stats/revenue', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        // for Debugging
        // console.log('🔍 Revenue Calculation Debug:');
        // console.log('Today:', today);
        // console.log('Month Start:', monthStart);
        // console.log('Current time:', now.toISOString());

         // Debug: Check all paid invoices and their dates
        // const allPaidInvoices = await DatabaseService.all(`
        //     SELECT invoice_number, total_amount, issued_at, DATE(issued_at) as issue_date
        //     FROM invoices 
        //     WHERE status = 'paid'
        //     ORDER BY issued_at DESC
        // `);

        // console.log('📊 All Paid Invoices:');
        // allPaidInvoices.forEach(inv => {
        //     console.log(`- ${inv.invoice_number}: $${inv.total_amount} on ${inv.issue_date}`);
        // });
     
        
        const todayRevenue = await DatabaseService.get(
            `SELECT COALESCE(SUM(total_amount), 0) as revenue 
             FROM invoices 
             WHERE DATE(issued_at) = DATE(?) AND status = 'paid'`,
            [now.toISOString()]
        );

        const monthRevenue = await DatabaseService.get(
            `SELECT COALESCE(SUM(total_amount), 0) as revenue 
             FROM invoices 
             WHERE DATE(issued_at) >= DATE(?) AND status = 'paid'`,
            [monthStart]
        );

        const totalInvoices = await DatabaseService.get(
            `SELECT COUNT(*) as count FROM invoices WHERE status = 'paid'`
        );

        const totalProducts = await DatabaseService.get(
            `SELECT COUNT(*) as count FROM products`
        );

        // // Debug: Log revenue results
        // console.log('💰 Revenue Results:');
        // console.log('Today Revenue:', todayRevenue.revenue);
        // console.log('Month Revenue:', monthRevenue.revenue);
        // console.log('Total Invoices:', totalInvoices.count);
        // console.log('Total Products:', totalProducts.count);

        res.json({
            todayRevenue: todayRevenue.revenue,
            monthRevenue: monthRevenue.revenue,
            totalInvoices: totalInvoices.count,
            totalProducts: totalProducts.count
        });
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ error: 'Failed to fetch revenue statistics' });
    }
});

export default router; 