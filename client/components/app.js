// Main application controller
class BillingApp {
    constructor() {
        this.products = [];
        this.invoices = [];
        this.init();
    }

    async init() {
        console.log('Initializing Billing App...');
        
        try {
            // Test backend connection
            await this.checkHealth();
            
            // Load initial data
            await this.loadProducts();
            
            // Update UI
            this.updateStatus('✅ System ready!', 'success');
            this.renderProducts();
            this.renderRevenueStats();
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.updateStatus('❌ Failed to connect to server. Make sure backend is running.', 'error');
        }
    }

    async checkHealth() {
        const response = await fetch('/api/health');
        if (!response.ok) {
            throw new Error('Backend not responding');
        }
        const data = await response.json();
        console.log('Health check:', data);
        return data;
    }

    async loadProducts() {
        // For now, we'll create some sample products
        // In next phase, we'll replace this with actual API call
        this.products = [
            {
                id: 'prod_1',
                sku: 'TSHIRT-BLK-M',
                name: 'Black T-Shirt',
                price: 599,
                stock_quantity: 50
            },
            {
                id: 'prod_2',
                sku: 'JEANS-BLU-32',
                name: 'Blue Jeans',
                price: 1299,
                stock_quantity: 30
            },
            {
                id: 'prod_3', 
                sku: 'SHIRT-WHT-L',
                name: 'White Shirt',
                price: 899,
                stock_quantity: 25
            }
        ];
    }

    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.style.background = type === 'success' ? '#e8f5e8' : 
                                  type === 'error' ? '#ffe8e8' : '#e8f4fd';
        statusEl.style.borderColor = type === 'success' ? '#4caf50' : 
                                   type === 'error' ? '#f44336' : '#2196f3';
    }

    renderProducts() {
        const productsEl = document.getElementById('products-list');
        productsEl.innerHTML = `
            <div style="display: grid; gap: 0.5rem;">
                ${this.products.map(product => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f8f9fa; border-radius: 4px;">
                        <span>${product.name}</span>
                        <span>₹${product.price} (Stock: ${product.stock_quantity})</span>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 1rem; color: #666; font-size: 0.9em;">
                Total: ${this.products.length} products
            </p>
        `;
    }

    renderRevenueStats() {
        const revenueEl = document.getElementById('revenue-stats');
        revenueEl.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                <div>
                    <strong>Today's Revenue:</strong>
                    <div style="font-size: 1.5em; color: #2c5aa0;">₹0.00</div>
                </div>
                <div>
                    <strong>This Month:</strong>
                    <div style="font-size: 1.2em;">₹0.00</div>
                </div>
                <div>
                    <strong>Total Invoices:</strong>
                    <div style="font-size: 1.2em;">0</div>
                </div>
            </div>
            <p style="margin-top: 1rem; color: #666; font-size: 0.9em;">
                Add your first invoice to see revenue data!
            </p>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BillingApp()});
