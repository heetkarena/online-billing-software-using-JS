class InvoiceList extends HTMLElement {
    constructor() {
        super();
        this.invoices = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.loadInvoices();
        this.render();
        
        // Refresh when new invoices are created
        document.addEventListener('invoice-created', () => {
            this.loadInvoices();
        });
    }

    async loadInvoices() {
        try {
            const response = await fetch('/api/invoices');
            if (!response.ok) throw new Error('Failed to fetch invoices');
            
            this.invoices = await response.json();
            this.render();
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.renderError('Failed to load invoices');
        }
    }

    formatCurrency(amount) {
        return '₹' + parseFloat(amount || 0).toFixed(2);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusBadge(status) {
        const statusConfig = {
            'paid': { class: 'status-paid', text: 'Paid' },
            'draft': { class: 'status-draft', text: 'Draft' },
            'overdue': { class: 'status-overdue', text: 'Overdue' }
        };
        
        const config = statusConfig[status] || { class: 'status-unknown', text: status };
        return `<span class="status-badge ${config.class}">${config.text}</span>`;
    }

    async viewInvoiceDetails(invoiceId) {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}`);
            if (!response.ok) throw new Error('Failed to fetch invoice details');
            
            const invoice = await response.json();
            this.showInvoiceModal(invoice);
        } catch (error) {
            alert('Error loading invoice details: ' + error.message);
        }
    }

    showInvoiceModal(invoice) {
        const modal = document.createElement('div');
        modal.className = 'invoice-modal';
        modal.innerHTML = `
            <style>
                .invoice-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    border-bottom: 2px solid #2c5aa0;
                    padding-bottom: 1rem;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                }
                .invoice-details {
                    margin-bottom: 1.5rem;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-size: 1em;
                }
                .line-items {
                    margin: 1.5rem 0;
                }
                .line-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .totals {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-top: 1rem;
                    margin-left: 1.5rem;
                    font-size: 1rem;
                }
                .print-btn {
                    background: #2c5aa0;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 1rem;
                    margin-left: 1.5rem;
                }
            </style>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Invoice ${invoice.invoice_number}</h2>
                    <button class="close-btn" onclick="this.closest('.invoice-modal').remove()">×</button>
                </div>
                
                <div class="invoice-details">
                    <div class="detail-row">
                        <strong>Customer:</strong>
                        <span>${invoice.customer_name}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Date:</strong>
                        <span>${this.formatDate(invoice.issued_at)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong>
                        ${this.getStatusBadge(invoice.status)}
                    </div>
                    <div class="detail-row">
                        <strong>Payment Method:</strong>
                        <span>${invoice.payment_method || 'Cash'}</span>
                    </div>
                </div>

                <div class="line-items">
                    <h3>Items</h3>
                    ${invoice.lineItems ? invoice.lineItems.map(item => `
                        <div class="line-item">
                            <div>
                                <div>${item.product_name || 'Product'}</div>
                                <small>SKU: ${item.sku || 'N/A'}</small>
                            </div>
                            <div>
                                <div>${item.quantity} × ₹${item.unit_price}</div>
                                <strong>₹${item.line_total}</div>
                            </div>
                        </div>
                    `).join('') : '<p>No items found</p>'}
                </div>

                <div class="totals">
                    <div class="detail-row">
                        <span>Subtotal:</span>
                        <span>₹${invoice.subtotal}</span>
                    </div>
                    <div class="detail-row">
                        <span>Tax (18%):</span>
                        <span>₹${invoice.tax_amount}</span>
                    </div>
                    <div class="detail-row" style="font-size: 1.2em; font-weight: bold;">
                        <span>Total:</span>
                        <span>₹${invoice.total_amount}</span>
                    </div>
                </div>

                <button class="print-btn" onclick="this.getRootNode().host.printInvoice(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
                    🖨️ Print Invoice
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    printInvoice(invoice) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoice_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .details { margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #f5f5f5; }
                    .totals { margin-top: 20px; text-align: right; }
                    .thank-you { text-align: center; margin-top: 40px; font-style: italic; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CLOTHING STORE</h1>
                    <h2>INVOICE</h2>
                    <h3>${invoice.invoice_number}</h3>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <strong>Date:</strong> ${this.formatDate(invoice.issued_at)}
                    </div>
                    <div class="detail-row">
                        <strong>Customer:</strong> ${invoice.customer_name}
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong> ${invoice.status.toUpperCase()}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.lineItems ? invoice.lineItems.map(item => `
                            <tr>
                                <td>${item.product_name || 'Product'}</td>
                                <td>${item.sku || 'N/A'}</td>
                                <td>${item.quantity}</td>
                                <td>₹${item.unit_price}</td>
                                <td>₹${item.line_total}</td>
                            </tr>
                        `).join('') : ''}
                    </tbody>
                </table>

                <div class="totals">
                    <div><strong>Subtotal: ₹${invoice.subtotal}</strong></div>
                    <div><strong>Tax (18%): ₹${invoice.tax_amount}</strong></div>
                    <div style="font-size: 1.2em;"><strong>Total: ₹${invoice.total_amount}</strong></div>
                </div>

                <div class="thank-you">
                    Thank you for your business!
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .invoice-list {
                    margin-top: 1rem;
                }
                
                .invoice-card {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .invoice-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                
                .invoice-info h3 {
                    margin: 0 0 0.5rem 0;
                    color: #2c5aa0;
                }
                
                .invoice-meta {
                    color: #666;
                    font-size: 0.9em;
                }
                
                .invoice-amount {
                    text-align: right;
                }
                
                .amount {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #28a745;
                    margin-bottom: 0.5rem;
                }
                
                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .status-paid {
                    background: #e8f5e8;
                    color: #28a745;
                }
                
                .status-draft {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .status-overdue {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .invoice-items {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f0f0f0;
                }
                
                .items-count {
                    color: #666;
                    font-size: 0.9em;
                }
                
                .view-btn {
                    background: #2c5aa0;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                    font-style: italic;
                }
                
                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                }
            </style>
            
            <div class="invoice-list">
                <h2>📋 Recent Invoices</h2>
                
                ${this.invoices.length === 0 ? `
                    <div class="empty-state">
                        No invoices found. Create your first invoice to see it here!
                    </div>
                ` : ''}
                
                ${this.invoices.map(invoice => `
                    <div class="invoice-card" onclick="this.getRootNode().host.viewInvoiceDetails('${invoice.id}')">
                        <div class="invoice-header">
                            <div class="invoice-info">
                                <h3>${invoice.invoice_number}</h3>
                                <div class="invoice-meta">
                                    ${invoice.customer_name} • ${this.formatDate(invoice.issued_at)}
                                </div>
                            </div>
                            <div class="invoice-amount">
                                <div class="amount">${this.formatCurrency(invoice.total_amount)}</div>
                                ${this.getStatusBadge(invoice.status)}
                            </div>
                        </div>
                        
                        <div class="invoice-items">
                            <div class="items-count">
                                ${invoice.items_count || 0} items • ${invoice.payment_method || 'Cash'}
                            </div>
                            <button class="view-btn" onclick="event.stopPropagation(); this.getRootNode().host.viewInvoiceDetails('${invoice.id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderError(message) {
        this.shadowRoot.innerHTML = `
            <div class="error">
                ${message}
            </div>
        `;

        // const closeBtn = this.shadowRoot.querySelector(".btn-cancel");
        // closeBtn.addEventListener("click", () => this.handleClose());
    }
}

customElements.define('invoice-list', InvoiceList);