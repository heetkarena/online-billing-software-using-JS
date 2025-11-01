class Invoice {
    constructor() {
        this.id = this.generateId();
        this.invoiceNumber = '';
        this.customerId = null;
        this.customerName = 'Walk-in Customer';
        this.lineItems = [];
        this.status = 'draft'; // draft, paid, overdue
        this.subtotal = 0;
        this.taxRate = 0.18; // 18% GST
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.issuedAt = new Date();
        this.notes = '';
        this.paymentMethod = 'cash'; // cash, card, upi
    }

    generateId() {
        return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addLineItem(product, quantity) {
        // Check stock availability
        if (product.stockQuantity < quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
        }

        const lineItem = {
            id: 'li_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: quantity,
            unitPrice: product.price,
            lineTotal: product.price * quantity
        };

        this.lineItems.push(lineItem);
        this.calculateTotals();
        return lineItem;
    }

    removeLineItem(lineItemId) {
        this.lineItems = this.lineItems.filter(item => item.id !== lineItemId);
        this.calculateTotals();
    }

    updateLineItemQuantity(lineItemId, quantity) {
        const lineItem = this.lineItems.find(item => item.id === lineItemId);
        if (lineItem) {
            lineItem.quantity = quantity;
            lineItem.lineTotal = lineItem.unitPrice * quantity;
            this.calculateTotals();
        }
    }

    calculateTotals() {
        this.subtotal = this.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
        this.taxAmount = this.subtotal * this.taxRate;
        this.totalAmount = this.subtotal + this.taxAmount;

            // Fix floating point precision
        this.subtotal = parseFloat(this.subtotal.toFixed(2));
        this.taxAmount = parseFloat(this.taxAmount.toFixed(2));
        this.totalAmount = parseFloat(this.totalAmount.toFixed(2));

    }

    markAsPaid(paymentMethod = 'cash') {
        this.status = 'paid';
        this.paymentMethod = paymentMethod;
    }

    generateInvoiceNumber(invoiceCount) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(invoiceCount + 1).padStart(4, '0');
        this.invoiceNumber = `INV-${year}${month}-${sequence}`;
    }

    toJSON() {
        return {
            id: this.id,
            invoiceNumber: this.invoiceNumber,
            customerId: this.customerId,
            customerName: this.customerName,
            lineItems: this.lineItems,
            status: this.status,
            subtotal: parseFloat(this.subtotal.toFixed(2)),
            taxRate: this.taxRate,
            taxAmount: parseFloat(this.taxAmount.toFixed(2)),
            totalAmount: parseFloat(this.totalAmount.toFixed(2)),
            issuedAt: this.issuedAt,
            notes: this.notes,
            paymentMethod: this.paymentMethod
        };
    }

    static fromDatabase(row) {
        const invoice = new Invoice();
        invoice.id = row.id;
        invoice.invoiceNumber = row.invoice_number;
        invoice.customerId = row.customer_id;
        invoice.customerName = row.customer_name || 'Walk-in Customer';
        invoice.status = row.status;
        invoice.subtotal = row.subtotal;
        invoice.taxRate = row.tax_rate;
        invoice.taxAmount = row.tax_amount;
        invoice.totalAmount = row.total_amount;
        invoice.issuedAt = new Date(row.issued_at);
        invoice.notes = row.notes;
        invoice.paymentMethod = row.payment_method;
        return invoice;
    }
}

export default Invoice;