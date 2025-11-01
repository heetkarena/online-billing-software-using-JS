class AddProductForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.resetForm();
  }

  connectedCallback() {
    this.render();
  }

  resetForm() {
    this.formData = {
      sku: "",
      name: "",
      description: "",
      price: "",
      costPrice: "",
      stockQuantity: "0",
    };
  }

  handleInput(field, value) {
    this.formData[field] = value;
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (!this.formData.sku || !this.formData.name || !this.formData.price) {
      alert("Please fill in SKU, Name, and Price");
      return;
    }

    const btn = this.shadowRoot.querySelector(".btn-submit");
    btn.disabled = true;
    btn.textContent = "Adding...";

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.formData),
      });

      if (!response.ok) throw new Error("Failed to add product");
      const data = await response.json();

      alert(`✅ Product "${data.name}" added successfully!`);
      this.resetForm();
      this.render();
      document.dispatchEvent(new CustomEvent("closeAddProductForm"));
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Add Product";
    }
  }

  handleCancel() {
    document.dispatchEvent(new CustomEvent("closeAddProductForm"));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .form-container {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          min-width: 400px;
          max-width: 500px;
        }
        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #2c5aa0;
        }
        .form-group {
          margin-bottom: 1rem;
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.3rem;
        }
        input, textarea {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
        }
        button {
          border: none;
          border-radius: 6px;
          padding: 0.7rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
        }
        .btn-submit {
          background: #28a745;
          color: white;
        }
        .btn-submit:hover { background: #218838; }
        .btn-cancel {
          background: #ddd;
          color: #333;
        }
        .btn-cancel:hover { background: #ccc; }
      </style>

      <div class="form-container">
        <h2>➕ Add New Product</h2>
        <form id="productForm">
          <div class="form-group">
            <label>SKU *</label>
            <input type="text" required value="${this.formData.sku}" oninput="this.getRootNode().host.handleInput('sku', this.value)">
          </div>
          <div class="form-group">
            <label>Product Name *</label>
            <input type="text" required value="${this.formData.name}" oninput="this.getRootNode().host.handleInput('name', this.value)">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea oninput="this.getRootNode().host.handleInput('description', this.value)">${this.formData.description}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Selling Price (₹) *</label>
              <input type="number" required value="${this.formData.price}" oninput="this.getRootNode().host.handleInput('price', this.value)">
            </div>
            <div class="form-group">
              <label>Cost Price (₹)</label>
              <input type="number" value="${this.formData.costPrice}" oninput="this.getRootNode().host.handleInput('costPrice', this.value)">
            </div>
          </div>
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="number" value="${this.formData.stockQuantity}" oninput="this.getRootNode().host.handleInput('stockQuantity', this.value)">
          </div>
          <div class="actions">
            <button type="submit" class="btn-submit">Add Product</button>
            <button type="button" class="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    `;

    const form = this.shadowRoot.querySelector("#productForm");
    const cancelBtn = this.shadowRoot.querySelector(".btn-cancel");

    form.addEventListener("submit", (e) => this.handleSubmit(e));
    cancelBtn.addEventListener("click", () => this.handleCancel());
  }
}

customElements.define("add-product-form", AddProductForm);
