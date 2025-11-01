class SearchFilter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.filters = {
            search: '',
            status: 'all',
            dateRange: 'all'
        };
    }

    connectedCallback() {
        this.render();
    }

    handleFilterChange() {
        this.dispatchEvent(new CustomEvent('filters-changed', {
            detail: { filters: this.filters },
            bubbles: true
        }));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .search-filter {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .filter-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr auto;
                    gap: 1rem;
                    align-items: end;
                }
                
                .form-group {
                    margin-bottom: 0;
                }
                
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #333;
                }
                
                input, select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }
                
                .btn-clear {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    white-space: nowrap;
                }
                
                .btn-clear:hover {
                    background: #5a6268;
                }
                
                @media (max-width: 768px) {
                    .filter-row {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="search-filter">
                <div class="filter-row">
                    <div class="form-group">
                        <label for="search">Search Invoices & Products</label>
                        <input type="text" id="search" 
                               placeholder="Search by invoice number, customer, or product..."
                               oninput="this.getRootNode().host.filters.search = this.value; this.getRootNode().host.handleFilterChange()">
                    </div>
                    
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" 
                                onchange="this.getRootNode().host.filters.status = this.value; this.getRootNode().host.handleFilterChange()">
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="draft">Draft</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="dateRange">Date Range</label>
                        <select id="dateRange" 
                                onchange="this.getRootNode().host.filters.dateRange = this.value; this.getRootNode().host.handleFilterChange()">
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button class="btn-clear" 
                                onclick="this.getRootNode().host.clearFilters()">
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    clearFilters() {
        this.filters = { search: '', status: 'all', dateRange: 'all' };
        this.render();
        this.handleFilterChange();
    }
}

customElements.define('search-filter', SearchFilter);