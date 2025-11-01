class RevenueDashboard extends HTMLElement {
    constructor() {
        super();
        this.stats = {};
        this.attachShadow({ mode: 'open' });
        
        // Listen for new invoices
        document.addEventListener('invoice-created', () => {
            this.loadStats();
        });
    }

    connectedCallback() {
        this.loadStats();
        // Refresh stats every 30 seconds
        this.interval = setInterval(() => this.loadStats(), 30000);
    }

    disconnectedCallback() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/invoices/stats/revenue');
            if (!response.ok) throw new Error('Failed to fetch stats');
            
            this.stats = await response.json();
            this.render();
        } catch (error) {
            console.error('Error loading revenue stats:', error);
        }
    }

    formatCurrency(amount) {
        return '₹' + parseFloat(amount || 0).toFixed(2);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .dashboard {
                    display: grid;
                    padding-top: 2rem;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                
                .stat-card {
                    background: white;
                    padding-top: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                    border-left: 4px solid #2c5aa0;
                    border-right: 4px solid #2c5aa0;
                    border-top: 4px solid #2c5aa0;
                    border-bottom: 4px solid #2c5aa0;
                }
                
                .stat-icon {
                    font-size: 1.5em;
                    margin-bottom: 0.5rem;
                }
                
                .stat-value {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #2c5aa0;
                    margin: 0.5rem 0;
                }
                
                .stat-label {
                    color: #666;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .stat-trend {
                    font-size: 0.8em;
                    margin-top: 0.5rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 16px;
                    padding-top: 0.25rem;
                    padding-bottom: 0.25rem;
                    display: inline-block;
                }
                
                .trend-up {
                    background: #e8f5e8;
                    color: #28a745;
                }
                
                .trend-down {
                    background: #ffe8e8;
                    color: #dc3545;
                }
                
                .loading {
                    color: #666;
                    font-style: italic;
                    text-align: center;
                    padding: 2rem;
                }
            </style>
            
            <div class="dashboard">
                <div class="stat-card">
                    <div class="stat-icon">Today's Revenue</div>
                    <div class="stat-value">${this.formatCurrency(this.stats.todayRevenue)}</div>
                    <div class="stat-label">Today's Revenue</div>
                    <div class="stat-trend trend-up">Live</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">This Month's Revenue</div>
                    <div class="stat-value">${this.formatCurrency(this.stats.monthRevenue)}</div>
                    <div class="stat-label">This Month</div>
                    <div class="stat-trend trend-up">Current</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">No. Invoices</div>
                    <div class="stat-value">${this.stats.totalInvoices || 0}</div>
                    <div class="stat-label">Total Invoices</div>
                    <div class="stat-trend">Paid</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">Total Products</div>
                    <div class="stat-value">${this.stats.totalProducts || 0}</div>
                    <div class="stat-label">Products</div>
                    <div class="stat-trend">Active</div>
                </div>
            </div>
            
            ${!this.stats.todayRevenue ? `
                <div class="loading">
                    Revenue data will appear here after creating your first invoice!
                </div>
            ` : ''}
        `;
    }
}

customElements.define('revenue-dashboard', RevenueDashboard);