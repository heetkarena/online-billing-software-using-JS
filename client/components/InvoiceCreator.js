class InvoiceCreator extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.lineItems = [];
        this.attachShadow({ mode: 'open' });
        this.customerName = 'Walk-in Customer';
        this.paymentMethod = 'cash';
        this.notes = '';
    }

    connectedCallback() {
        this.loadProducts();
        this.render();
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            this.products = await response.json();
            this.render();
        } catch (error) {
            console.error('Error loading products:', error);
            this.renderError('Failed to load products');
        }
    }

    addProductToInvoice(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Check if product already in invoice
        const existingItem = this.lineItems.find(item => item.productId === productId);
        if (existingItem) {
            if (product.stockQuantity < existingItem.quantity + quantity) {
                alert(`Cannot add more. Only ${product.stockQuantity} items available in stock.`);
                return;
            }
            existingItem.quantity += quantity;
            existingItem.lineTotal = existingItem.unitPrice * existingItem.quantity;
        } else {
            if (product.stockQuantity < quantity) {
                alert(`Only ${product.stockQuantity} items available in stock.`);
                return;
            }
            this.lineItems.push({
                id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                quantity: quantity,
                unitPrice: product.price,
                lineTotal: product.price * quantity
            });
        }

        this.calculateTotals();
        this.render();
    }

    removeLineItem(lineItemId) {
        this.lineItems = this.lineItems.filter(item => item.id !== lineItemId);
        this.calculateTotals();
        this.render();
    }

    updateLineItemQuantity(lineItemId, quantity) {
        if (quantity < 1) {
            this.removeLineItem(lineItemId);
            return;
        }

        const lineItem = this.lineItems.find(item => item.id === lineItemId);
        if (lineItem) {
            const product = this.products.find(p => p.id === lineItem.productId);
            if (product && quantity > product.stockQuantity) {
                alert(`Only ${product.stockQuantity} items available in stock.`);
                return;
            }
            lineItem.quantity = quantity;
            lineItem.lineTotal = lineItem.unitPrice * quantity;
            this.calculateTotals();
            this.render();
        }
    }

    calculateTotals() {
        this.subtotal = this.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
        this.taxAmount = this.subtotal * 0.18; // 18% tax
        this.totalAmount = this.subtotal + this.taxAmount;
    }

    async createInvoice() {
        if (this.lineItems.length === 0) {
            alert('Please add at least one product to the invoice');
            return;
        }

        const submitBtn = this.shadowRoot.querySelector('.btn-create-invoice');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Invoice...';

        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: this.customerName,
                    lineItems: this.lineItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    })),
                    notes: this.notes,
                    paymentMethod: this.paymentMethod
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create invoice');
            }

            const newInvoice = await response.json();
            
            // Reset form
            this.lineItems = [];
            this.customerName = 'Walk-in Customer';
            this.paymentMethod = 'cash';
            this.notes = '';
            this.calculateTotals();
            this.render();
            
            // Dispatch event for other components
            this.dispatchEvent(new CustomEvent('invoice-created', {
                detail: { invoice: newInvoice },
                bubbles: true
            }));
            
            alert(`Invoice ${newInvoice.invoiceNumber} created successfully! Total: ₹${newInvoice.totalAmount}`);
            
        } catch (error) {
            alert('Error creating invoice: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Invoice';
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .invoice-creator {
                    padding-top: 1rem;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                }
                
                .creator-header {
                    padding-top: 1rem;
                    padding-bottom: 1rem;
                    // text-align: center;
                    background: #2c5aa0;
                    color: white;
                    padding: 1rem 1.5rem;
                }
                
                .creator-body {
                    padding: 1.5rem;
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .product-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .product-card:hover {
                    border-color: #2c5aa0;
                    box-shadow: 0 2px 8px rgba(44, 90, 160, 0.1);
                }
                
                .product-name {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                
                .product-details {
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 0.5rem;
                }
                
                .product-price {
                    color: #2c5aa0;
                    font-weight: 600;
                }
                
                .product-stock {
                    font-size: 0.8em;
                    color: #999;
                }
                
                .invoice-items {
                    margin: 2rem 0;
                }
                
                .invoice-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .item-info {
                    flex: 1;
                }
                
                .item-name {
                    font-weight: 600;
                }
                
                .item-sku {
                    color: #666;
                    font-size: 0.9em;
                }
                
                .item-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .qty-btn {
                    width: 30px;
                    height: 30px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .qty-input {
                    width: 50px;
                    text-align: center;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 0.25rem;
                }
                
                .remove-btn {
                    color: #dc3545;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                }
                
                .item-total {
                    font-weight: 600;
                    min-width: 80px;
                    text-align: right;
                }
                
                .invoice-totals {
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 6px;
                    margin: 1.5rem 0;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                
                .total-final {
                    font-size: 1.2em;
                    font-weight: 700;
                    color: #2c5aa0;
                    border-top: 1px solid #dee2e6;
                    padding-top: 0.5rem;
                    margin-top: 0.5rem;
                }
                
                .form-group {
                    margin-bottom: 1rem;
                }
                
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }
                
                input, select, textarea {
                    width: 100%;
                    padding: 0.50rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }
                
                .btn-create-invoice {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 6px;
                    font-size: 1.1em;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                }
                
                .btn-create-invoice:hover:not(:disabled) {
                    background: #218838;
                }
                
                .btn-create-invoice:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                    font-style: italic;
                }
            </style>
            
            <div class="invoice-creator">
                <div class="creator-header">
                    <h2 style="margin: 0;">Create New Invoice</h2>
                </div>
                
                <div class="creator-body">
                    <!-- Customer Information -->
                    <div class="form-group">
                        <label for="customerName">Customer Name</label>
                        <input type="text" id="customerName" 
                               value="${this.customerName}"
                               oninput="this.getRootNode().host.customerName = this.value"
                               placeholder="Customer Name">
                    </div>
                    
                    <!-- Products Grid -->
                    <h3>Add Products</h3>
                    <div class="products-grid">
                        ${this.products.map(product => `
                            <div class="product-card" 
                                 onclick="this.getRootNode().host.addProductToInvoice('${product.id}', 1)">
                                <div class="product-name">${product.name}</div>
                                <div class="product-details">${product.sku}</div>
                                <div class="product-price">₹${product.price}</div>
                                <div class="product-stock">Stock: ${product.stockQuantity}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Invoice Items -->
                    <h3>Invoice Items</h3>
                    <div class="invoice-items">
                        ${this.lineItems.length === 0 ? `
                            <div class="empty-state">
                                No items added. Click on products above to add them to the invoice.
                            </div>
                        ` : ''}
                        
                        ${this.lineItems.map(item => `
                            <div class="invoice-item">
                                <div class="item-info">
                                    <div class="item-name">${item.productName}</div>
                                    <div class="item-sku">${item.productSku} • ₹${item.unitPrice} each</div>
                                </div>
                                <div class="item-controls">
                                    <div class="quantity-controls">
                                        <button class="qty-btn" 
                                                onclick="this.getRootNode().host.updateLineItemQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                        <input type="number" class="qty-input" 
                                               value="${item.quantity}"
                                               onchange="this.getRootNode().host.updateLineItemQuantity('${item.id}', parseInt(this.value))"
                                               min="1">
                                        <button class="qty-btn" 
                                                onclick="this.getRootNode().host.updateLineItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
                                    </div>
                                    <button class="remove-btn" 
                                            onclick="this.getRootNode().host.removeLineItem('${item.id}')">Remove</button>
                                </div>
                                <div class="item-total">₹${item.lineTotal}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Totals -->
                    ${this.lineItems.length > 0 ? `
                        <div class="invoice-totals">
                            <div class="total-row">
                                <span>Subtotal:</span>
                                <span>₹${this.subtotal?.toFixed(2) || 0}</span>
                            </div>
                            <div class="total-row">
                                <span>Tax (18%):</span>
                                <span>₹${this.taxAmount?.toFixed(2) || 0}</span>
                            </div>
                            <div class="total-row total-final">
                                <span>Total Amount:</span>
                                <span>₹${this.totalAmount?.toFixed(2) || 0}</span>
                            </div>
                        </div>
                        
                        <!-- Payment Information -->
                        <div class="form-group">
                            <label for="paymentMethod">Payment Method</label>
                            <select id="paymentMethod" 
                                    onchange="this.getRootNode().host.paymentMethod = this.value">
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="notes">Notes (Optional)</label>
                            <textarea id="notes" 
                                      oninput="this.getRootNode().host.notes = this.value"
                                      placeholder="Additional notes...">${this.notes}</textarea>
                        </div>
                        
                        <button class="btn-create-invoice" 
                                onclick="this.getRootNode().host.createInvoice()">
                            Create Invoice - ₹${this.totalAmount?.toFixed(2) || 0}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.shadowRoot.innerHTML = `
            <div class="error">
                ${message}
            </div>
        `;
    }
}

customElements.define('invoice-creator', InvoiceCreator);