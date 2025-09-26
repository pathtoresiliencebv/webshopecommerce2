// SHEIN Product Importer - Popup Script
class SheinImporter {
    constructor() {
        this.apiBaseUrl = 'https://ppvxydvbgbipvgvgaeja.supabase.co/functions/v1';
        this.authToken = null;
        this.userInfo = null;
        this.products = [];
        this.selectedProducts = new Set();
        
        this.init();
    }

    async init() {
        // Check if user is already logged in
        const stored = await chrome.storage.local.get(['authToken', 'userInfo']);
        if (stored.authToken && stored.userInfo) {
            this.authToken = stored.authToken;
            this.userInfo = stored.userInfo;
            
            // Validate token
            const isValid = await this.validateToken();
            if (isValid) {
                this.showMainSection();
            } else {
                this.showLoginSection();
            }
        } else {
            this.showLoginSection();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Scan button
        document.getElementById('scanBtn').addEventListener('click', () => {
            this.scanCurrentPage();
        });

        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importSelectedProducts();
        });

        // Select all button
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            this.toggleSelectAll();
        });

        // Price adjustment type change
        document.getElementById('priceAdjustmentType').addEventListener('change', (e) => {
            const valueInput = document.getElementById('priceAdjustmentValue');
            valueInput.disabled = e.target.value === 'none';
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.showMainSection();
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const organizationId = document.getElementById('organizationId').value;

        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = '';

        try {
            const response = await fetch(`${this.apiBaseUrl}/chrome-extension-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    organization_id: organizationId || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            this.authToken = data.token;
            this.userInfo = data.user;

            // Store credentials
            await chrome.storage.local.set({
                authToken: this.authToken,
                userInfo: this.userInfo,
                organizationId: data.organization_id,
            });

            this.showMainSection();
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message;
        }
    }

    async handleLogout() {
        this.authToken = null;
        this.userInfo = null;
        this.products = [];
        this.selectedProducts.clear();

        await chrome.storage.local.clear();
        this.showLoginSection();
    }

    async validateToken() {
        if (!this.authToken) return false;

        try {
            const response = await fetch(`${this.apiBaseUrl}/chrome-extension-auth`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    showLoginSection() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('mainSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
    }

    showMainSection() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'block';
        document.getElementById('errorSection').style.display = 'none';

        if (this.userInfo) {
            document.getElementById('userEmail').textContent = this.userInfo.email;
        }

        this.updateStats();
    }

    showErrorSection(message) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    async scanCurrentPage() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('shein.com')) {
                throw new Error('Please navigate to a SHEIN product page first');
            }

            // Inject content script to scan for products
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: this.extractSheinProducts,
            });

            if (results && results[0] && results[0].result) {
                this.products = results[0].result;
                this.selectedProducts.clear();
                this.renderProductsList();
                this.updateStats();
            } else {
                throw new Error('No products found on this page');
            }
        } catch (error) {
            console.error('Scan error:', error);
            this.showErrorSection(error.message);
        }
    }

    // This function will be injected into the SHEIN page
    extractSheinProducts() {
        const products = [];

        // Try to extract product from product detail page
        const productData = window.__PRELOADED_STATE__ || window.__INITIAL_STATE__;
        
        if (productData && productData.product) {
            const product = productData.product;
            products.push({
                id: product.goods_id || product.id,
                url: window.location.href,
                name: product.goods_name || document.querySelector('h1')?.textContent?.trim(),
                price: parseFloat(product.salePrice?.amount || product.price || '0'),
                original_price: parseFloat(product.originalPrice?.amount || product.original_price || '0'),
                currency: product.salePrice?.currency || 'USD',
                description: product.detail || document.querySelector('.product-intro')?.textContent?.trim() || '',
                images: product.goods_imgs?.map(img => img.origin_image) || 
                        Array.from(document.querySelectorAll('.crop-image-container img')).map(img => img.src),
                category: product.cat_name || '',
                rating: parseFloat(product.evaluation?.avg_score || '0'),
                reviews_count: parseInt(product.evaluation?.evaluation_num || '0'),
            });
        } else {
            // Fallback: try to extract from DOM
            const nameEl = document.querySelector('h1, .goods-title, .product-title');
            const priceEl = document.querySelector('.price, .sale-price, .goods-price');
            const imageEls = document.querySelectorAll('.crop-image-container img, .goods-image img');
            
            if (nameEl && priceEl) {
                const priceText = priceEl.textContent.replace(/[^\d.,]/g, '');
                const price = parseFloat(priceText.replace(',', '.'));
                
                products.push({
                    id: `shein_${Date.now()}`,
                    url: window.location.href,
                    name: nameEl.textContent.trim(),
                    price: price,
                    currency: 'USD',
                    description: document.querySelector('.product-intro, .goods-desc')?.textContent?.trim() || '',
                    images: Array.from(imageEls).map(img => img.src).slice(0, 5),
                    category: '',
                });
            }
        }

        // Try to extract from product lists (search results, category pages)
        const listItems = document.querySelectorAll('.product-item, .goods-item, [data-testid="product-item"]');
        listItems.forEach((item, index) => {
            const nameEl = item.querySelector('.goods-title, .product-title, h3, h4');
            const priceEl = item.querySelector('.price, .sale-price, .goods-price');
            const linkEl = item.querySelector('a');
            const imageEl = item.querySelector('img');
            
            if (nameEl && priceEl && linkEl) {
                const priceText = priceEl.textContent.replace(/[^\d.,]/g, '');
                const price = parseFloat(priceText.replace(',', '.'));
                
                products.push({
                    id: `shein_list_${index}_${Date.now()}`,
                    url: linkEl.href,
                    name: nameEl.textContent.trim(),
                    price: price,
                    currency: 'USD',
                    description: '',
                    images: imageEl ? [imageEl.src] : [],
                });
            }
        });

        return products.filter(p => p.name && p.price > 0);
    }

    renderProductsList() {
        const container = document.getElementById('productsList');
        container.innerHTML = '';

        this.products.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'product-item';
            
            const isSelected = this.selectedProducts.has(index);
            
            item.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} data-index="${index}">
                <img src="${product.images[0] || ''}" alt="${product.name}" class="product-thumbnail" 
                     onerror="this.style.display='none'">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">$${product.price.toFixed(2)} ${product.currency}</div>
                </div>
            `;

            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                const productIndex = parseInt(e.target.dataset.index);
                if (e.target.checked) {
                    this.selectedProducts.add(productIndex);
                } else {
                    this.selectedProducts.delete(productIndex);
                }
                this.updateStats();
            });

            container.appendChild(item);
        });
    }

    updateStats() {
        document.getElementById('productsFound').textContent = this.products.length;
        document.getElementById('productsSelected').textContent = this.selectedProducts.size;
        
        const importBtn = document.getElementById('importBtn');
        importBtn.disabled = this.selectedProducts.size === 0;
    }

    toggleSelectAll() {
        const selectAllBtn = document.getElementById('selectAllBtn');
        
        if (this.selectedProducts.size === this.products.length) {
            // Deselect all
            this.selectedProducts.clear();
            selectAllBtn.textContent = 'Select All';
        } else {
            // Select all
            this.products.forEach((_, index) => {
                this.selectedProducts.add(index);
            });
            selectAllBtn.textContent = 'Deselect All';
        }

        // Update checkboxes
        const checkboxes = document.querySelectorAll('#productsList input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = this.selectedProducts.has(index);
        });

        this.updateStats();
    }

    async importSelectedProducts() {
        if (this.selectedProducts.size === 0) return;

        const selectedProductsArray = Array.from(this.selectedProducts).map(index => this.products[index]);
        
        // Get import settings
        const autoApprove = document.getElementById('autoApprove').checked;
        const priceAdjustmentType = document.getElementById('priceAdjustmentType').value;
        const priceAdjustmentValue = parseFloat(document.getElementById('priceAdjustmentValue').value) || 0;

        const importSettings = {
            auto_approve: autoApprove,
        };

        if (priceAdjustmentType !== 'none' && priceAdjustmentValue !== 0) {
            importSettings.price_adjustment = {
                type: priceAdjustmentType,
                value: priceAdjustmentValue,
            };
        }

        // Show progress section
        const progressSection = document.getElementById('importProgress');
        const importBtn = document.getElementById('importBtn');
        progressSection.style.display = 'block';
        importBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/shein-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`,
                },
                body: JSON.stringify({
                    products: selectedProductsArray,
                    import_settings: importSettings,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Import failed');
            }

            // Update progress
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const importResults = document.getElementById('importResults');

            progressFill.style.width = '100%';
            progressText.textContent = `${result.processed} / ${result.total_products} products processed`;

            const resultsHtml = `
                <div class="success">✅ Successfully imported: ${result.successful}</div>
                ${result.failed > 0 ? `<div class="error">❌ Failed: ${result.failed}</div>` : ''}
                ${result.auto_approved > 0 ? `<div class="success">🔄 Auto-approved: ${result.auto_approved}</div>` : ''}
                ${result.pending_approval > 0 ? `<div>⏳ Pending approval: ${result.pending_approval}</div>` : ''}
            `;

            importResults.innerHTML = resultsHtml;

            // Clear selected products after successful import
            setTimeout(() => {
                this.selectedProducts.clear();
                this.updateStats();
                progressSection.style.display = 'none';
                importBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Import error:', error);
            
            const importResults = document.getElementById('importResults');
            importResults.innerHTML = `<div class="error">❌ Import failed: ${error.message}</div>`;
            
            setTimeout(() => {
                progressSection.style.display = 'none';
                importBtn.disabled = false;
            }, 3000);
        }
    }
}

// Initialize the importer when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new SheinImporter();
});