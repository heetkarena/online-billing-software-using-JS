class Product {
    constructor(id, sku, name, description, price, costPrice, stockQuantity) {
        this.id = id || this.generateId();
        this.sku = sku;
        this.name = name;
        this.description = description || '';
        this.price = price;
        this.costPrice = costPrice || price;
        this.stockQuantity = stockQuantity || 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateStock(quantity) {
        if (this.stockQuantity + quantity < 0) {
            throw new Error('Insufficient stock');
        }
        this.stockQuantity += quantity;
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            sku: this.sku,
            name: this.name,
            description: this.description,
            price: parseFloat(this.price),
            costPrice: parseFloat(this.costPrice),
            stockQuantity: parseInt(this.stockQuantity),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromDatabase(row) {
        const product = new Product(
            row.id,
            row.sku,
            row.name,
            row.description,
            row.price,
            row.cost_price,
            row.stock_quantity
        );
        product.createdAt = new Date(row.created_at);
        product.updatedAt = new Date(row.updated_at);
        return product;
    }
}

export default Product;