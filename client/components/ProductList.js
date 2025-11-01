// client/components/ProductList.js
class ProductList extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.loadProducts();
        this.render();
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            this.products = await response.json();
            this.render();
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    handleClose() {
            // console.log("close button clicked inside ProductList"); //for debugging
            document.dispatchEvent(new CustomEvent('closeProductList'));
        }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1rem;
                    padding: 1rem;
                }
                .product-card {
                    border: 1px solid #ddd;
                    padding: 1rem;
                    border-radius: 8px;
                    background: white;
                }
                .product-name {
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }
                .product-price {
                    color: #2c5aa0;
                    font-size: 1.2em;
                }
                .product-stock {
                    color: #666;
                    font-size: 0.9em;
                }
                .btn-cancel {
                    background: #ddd;
                    color: #333;
                }
                .btn-cancel:hover { background: #ccc; 
                }
                .actions {
                    display: flex;
                    justify-content: center;
                    margin-top: 1.5rem;
                }
                button {
                    border: none;
                    border-radius: 6px;
                    padding: 0.7rem 1.5rem;
                    font-size: 1rem;
                    cursor: pointer;
                }
            </style>              
            <div class="product-grid">
                ${this.products.map(product => `
                    <div class="product-card" data-product-id="${product.id}">
                        <div class="product-name">${product.name}</div>
                        <div class="product-sku">SKU: ${product.sku}</div>
                        <div class="product-price">₹${product.price}</div>
                        <div class="product-stock">Stock: ${product.stockQuantity}</div>
                    </div>
                `).join('')}
                    <div class="actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                    </div>  
            </div>
        `;

        const closeBtn = this.shadowRoot.querySelector(".btn-cancel");
        closeBtn.addEventListener("click", () => this.handleClose());
    }
}

customElements.define('product-list', ProductList);