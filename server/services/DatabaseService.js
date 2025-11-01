import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseService {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(
                join(__dirname, '../../database.sqlite'),
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Connected to SQLite database');
                        this.initTables().then(resolve).catch(reject);
                    }
                }
            );
        });
    }

    async initTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                sku TEXT UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                cost_price REAL,
                stock_quantity INTEGER DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            )`,
            `CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                invoice_number TEXT UNIQUE,
                customer_id TEXT,
                customer_name TEXT,
                status TEXT DEFAULT 'draft',
                subtotal REAL,
                tax_rate REAL,
                tax_amount REAL,
                total_amount REAL,
                payment_method TEXT,
                issued_at DATETIME,
                notes TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS invoice_line_items (
                id TEXT PRIMARY KEY,
                invoice_id TEXT,
                product_id TEXT,
                quantity INTEGER,
                unit_price REAL,
                line_total REAL,
                FOREIGN KEY (invoice_id) REFERENCES invoices (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`
        ];

        for (const query of queries) {
            await this.run(query);
        }
        console.log('✅ Database tables initialized');
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

export default new DatabaseService();