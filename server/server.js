import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import DatabaseService from './services/DatabaseService.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../client')));

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Billing API is running!',
        timestamp: new Date().toISOString()
    });
});

// Add this line to register product routes
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../client/index.html'));
});

// Initialize database and start server
DatabaseService.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Billing software running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log(`Products API: http://localhost:${PORT}/api/products`);
        console.log(`Invoices API: http://localhost:${PORT}/api/invoices`);
    });
}).catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
