// SHEIN Product Importer - Content Script
(function() {
    'use strict';

    let isInjected = false;
    let highlightOverlay = null;

    // Initialize content script
    function init() {
        if (isInjected) return;
        isInjected = true;

        // Create UI overlay for product selection
        createOverlay();
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener(handleMessage);
        
        // Inject additional scripts if needed
        injectScripts();
    }

    function createOverlay() {
        // Create floating action button for quick access
        const fab = document.createElement('div');
        fab.id = 'shein-importer-fab';
        fab.innerHTML = `
            <div class="fab-button">
                <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="Import">
            </div>
            <div class="fab-tooltip">Import to Aurelio Living</div>
        `;
        
        fab.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });

        document.body.appendChild(fab);

        // Create highlight overlay for product selection
        highlightOverlay = document.createElement('div');
        highlightOverlay.id = 'shein-importer-overlay';
        highlightOverlay.style.display = 'none';
        document.body.appendChild(highlightOverlay);
    }

    function injectScripts() {
        // Inject additional scripts for deep product data extraction
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        (document.head || document.documentElement).appendChild(script);
        script.onload = () => script.remove();
    }

    function handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'extractProducts':
                extractProducts().then(sendResponse);
                return true; // Keep message channel open for async response

            case 'highlightProducts':
                highlightProducts(request.products);
                break;

            case 'clearHighlights':
                clearHighlights();
                break;

            case 'getPageInfo':
                sendResponse({
                    url: window.location.href,
                    title: document.title,
                    isSheinPage: window.location.hostname.includes('shein.com')
                });
                break;
        }
    }

    async function extractProducts() {
        try {
            // Enhanced product extraction with multiple strategies
            const products = [];

            // Strategy 1: Extract from window global state
            const globalData = await extractFromGlobalState();
            if (globalData.length > 0) {
                products.push(...globalData);
            }

            // Strategy 2: Extract from DOM elements
            const domData = await extractFromDOM();
            if (domData.length > 0) {
                products.push(...domData);
            }

            // Strategy 3: Extract from API calls (if available)
            const apiData = await extractFromAPI();
            if (apiData.length > 0) {
                products.push(...apiData);
            }

            // Deduplicate products
            const uniqueProducts = deduplicateProducts(products);

            console.log(`Extracted ${uniqueProducts.length} unique products from SHEIN page`);
            return uniqueProducts;

        } catch (error) {
            console.error('Product extraction error:', error);
            return [];
        }
    }

    async function extractFromGlobalState() {
        const products = [];

        try {
            // Check various global state objects that SHEIN might use
            const stateObjects = [
                window.__PRELOADED_STATE__,
                window.__INITIAL_STATE__,
                window.__APP_STATE__,
                window.INITIAL_DATA,
                window.PAGE_DATA
            ];

            for (const state of stateObjects) {
                if (!state) continue;

                // Extract single product data
                if (state.product || state.goods || state.item) {
                    const productData = state.product || state.goods || state.item;
                    const product = parseProductData(productData);
                    if (product) products.push(product);
                }

                // Extract product list data
                if (state.products || state.goodsList || state.items) {
                    const productList = state.products || state.goodsList || state.items;
                    for (const item of productList) {
                        const product = parseProductData(item);
                        if (product) products.push(product);
                    }
                }

                // Check nested structures
                if (state.data) {
                    const nestedProducts = await extractFromGlobalState({ __PRELOADED_STATE__: state.data });
                    products.push(...nestedProducts);
                }
            }
        } catch (error) {
            console.warn('Error extracting from global state:', error);
        }

        return products;
    }

    async function extractFromDOM() {
        const products = [];

        try {
            // Product detail page
            const productDetailSelectors = [
                '.product-intro',
                '.goods-detail',
                '.item-detail',
                '[data-testid="product-detail"]'
            ];

            for (const selector of productDetailSelectors) {
                const productEl = document.querySelector(selector);
                if (productEl) {
                    const product = await extractSingleProductFromDOM(productEl);
                    if (product) products.push(product);
                    break; // Only extract one product from detail page
                }
            }

            // Product list page
            const productListSelectors = [
                '.product-item',
                '.goods-item',
                '.item-card',
                '[data-testid="product-item"]',
                '.product-card',
                '.goods-card'
            ];

            for (const selector of productListSelectors) {
                const productElements = document.querySelectorAll(selector);
                for (const element of productElements) {
                    const product = await extractSingleProductFromDOM(element);
                    if (product) products.push(product);
                }
                if (productElements.length > 0) break; // Use first matching selector
            }

        } catch (error) {
            console.warn('Error extracting from DOM:', error);
        }

        return products;
    }

    async function extractSingleProductFromDOM(element) {
        try {
            // Extract basic product information
            const nameSelectors = [
                'h1', 'h2', 'h3',
                '.product-title', '.goods-title', '.item-title',
                '.product-name', '.goods-name', '.item-name',
                '[data-testid="product-name"]'
            ];

            const priceSelectors = [
                '.price', '.sale-price', '.current-price',
                '.goods-price', '.item-price',
                '.price-current', '.price-now',
                '[data-testid="price"]'
            ];

            const imageSelectors = [
                'img[src*="goods_img"]',
                'img[src*="product"]',
                '.product-image img',
                '.goods-image img',
                '.item-image img'
            ];

            const linkSelectors = [
                'a[href*="/goods/"]',
                'a[href*="/product/"]',
                'a[href*="/item/"]'
            ];

            // Extract name
            let name = '';
            for (const selector of nameSelectors) {
                const nameEl = element.querySelector(selector);
                if (nameEl && nameEl.textContent.trim()) {
                    name = nameEl.textContent.trim();
                    break;
                }
            }

            // Extract price
            let price = 0;
            let currency = 'USD';
            for (const selector of priceSelectors) {
                const priceEl = element.querySelector(selector);
                if (priceEl) {
                    const priceText = priceEl.textContent.trim();
                    const priceMatch = priceText.match(/[\d.,]+/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[0].replace(',', '.'));
                        
                        // Try to extract currency
                        const currencyMatch = priceText.match(/([A-Z]{3}|\$|€|£|¥)/);
                        if (currencyMatch) {
                            const currencySymbol = currencyMatch[1];
                            currency = currencySymbol === '$' ? 'USD' :
                                      currencySymbol === '€' ? 'EUR' :
                                      currencySymbol === '£' ? 'GBP' :
                                      currencySymbol === '¥' ? 'JPY' : currencySymbol;
                        }
                        break;
                    }
                }
            }

            // Extract images
            const images = [];
            for (const selector of imageSelectors) {
                const imageEls = element.querySelectorAll(selector);
                for (const img of imageEls) {
                    if (img.src && !img.src.includes('placeholder')) {
                        images.push(img.src);
                    }
                }
                if (images.length > 0) break;
            }

            // Extract URL
            let url = window.location.href;
            for (const selector of linkSelectors) {
                const linkEl = element.querySelector(selector);
                if (linkEl && linkEl.href) {
                    url = linkEl.href;
                    break;
                }
            }

            // Validate required fields
            if (!name || price <= 0) {
                return null;
            }

            // Extract additional data
            const description = extractDescription(element);
            const category = extractCategory(element);
            const rating = extractRating(element);

            return {
                id: generateProductId(url, name),
                url: url,
                name: name,
                price: price,
                currency: currency,
                description: description,
                images: images.slice(0, 5), // Limit to 5 images
                category: category,
                rating: rating,
                source: 'dom_extraction'
            };

        } catch (error) {
            console.warn('Error extracting single product from DOM:', error);
            return null;
        }
    }

    function parseProductData(data) {
        try {
            if (!data || typeof data !== 'object') return null;

            // Map common SHEIN API fields to our format
            const fieldMappings = {
                id: ['goods_id', 'id', 'goodsId', 'product_id', 'productId'],
                name: ['goods_name', 'name', 'title', 'goodsName', 'product_name'],
                price: ['salePrice.amount', 'price', 'current_price', 'sale_price'],
                original_price: ['originalPrice.amount', 'original_price', 'market_price'],
                currency: ['salePrice.currency', 'currency', 'price_currency'],
                description: ['detail', 'description', 'goods_desc', 'summary'],
                images: ['goods_imgs', 'images', 'product_imgs', 'picture'],
                category: ['cat_name', 'category', 'category_name'],
                rating: ['evaluation.avg_score', 'rating', 'score'],
                reviews_count: ['evaluation.evaluation_num', 'reviews_count', 'review_num']
            };

            const product = {};

            // Extract fields using mappings
            for (const [key, paths] of Object.entries(fieldMappings)) {
                for (const path of paths) {
                    const value = getNestedValue(data, path);
                    if (value !== undefined && value !== null && value !== '') {
                        if (key === 'images' && Array.isArray(value)) {
                            product[key] = value.map(img => 
                                typeof img === 'string' ? img : 
                                img.origin_image || img.url || img.src || img
                            ).filter(Boolean);
                        } else if (key === 'price' || key === 'original_price' || key === 'rating') {
                            product[key] = parseFloat(value) || 0;
                        } else if (key === 'reviews_count') {
                            product[key] = parseInt(value) || 0;
                        } else {
                            product[key] = value;
                        }
                        break;
                    }
                }
            }

            // Validate required fields
            if (!product.name || !product.price) {
                return null;
            }

            // Set defaults
            product.id = product.id || generateProductId(window.location.href, product.name);
            product.url = window.location.href;
            product.currency = product.currency || 'USD';
            product.description = product.description || '';
            product.images = product.images || [];
            product.source = 'api_extraction';

            return product;

        } catch (error) {
            console.warn('Error parsing product data:', error);
            return null;
        }
    }

    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    function generateProductId(url, name) {
        // Generate a unique ID based on URL and name
        const urlHash = btoa(url).slice(0, 8);
        const nameHash = btoa(name).slice(0, 8);
        return `shein_${urlHash}_${nameHash}_${Date.now()}`;
    }

    function extractDescription(element) {
        const descSelectors = [
            '.product-intro', '.goods-intro', '.item-intro',
            '.product-desc', '.goods-desc', '.item-desc',
            '.description', '.summary'
        ];

        for (const selector of descSelectors) {
            const descEl = element.querySelector(selector);
            if (descEl && descEl.textContent.trim()) {
                return descEl.textContent.trim().slice(0, 500); // Limit length
            }
        }

        return '';
    }

    function extractCategory(element) {
        const catSelectors = [
            '.breadcrumb a:last-child',
            '.category', '.cat-name',
            '[data-category]'
        ];

        for (const selector of catSelectors) {
            const catEl = element.querySelector(selector);
            if (catEl) {
                return catEl.textContent?.trim() || catEl.dataset.category || '';
            }
        }

        return '';
    }

    function extractRating(element) {
        const ratingSelectors = [
            '.rating', '.score', '.star-rating',
            '[data-rating]'
        ];

        for (const selector of ratingSelectors) {
            const ratingEl = element.querySelector(selector);
            if (ratingEl) {
                const ratingText = ratingEl.textContent || ratingEl.dataset.rating || '';
                const ratingMatch = ratingText.match(/[\d.]+/);
                if (ratingMatch) {
                    return parseFloat(ratingMatch[0]);
                }
            }
        }

        return 0;
    }

    async function extractFromAPI() {
        // This would intercept API calls if possible
        // For now, return empty array
        return [];
    }

    function deduplicateProducts(products) {
        const seen = new Set();
        return products.filter(product => {
            const key = `${product.name}_${product.price}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    function highlightProducts(products) {
        // Add visual indicators for detected products
        products.forEach((product, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'shein-importer-indicator';
            indicator.textContent = `${index + 1}`;
            indicator.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #007AFF;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                z-index: 10000;
                pointer-events: none;
            `;

            // Try to find the product element to attach indicator
            // This is a simplified approach
            const productElements = document.querySelectorAll('.product-item, .goods-item');
            if (productElements[index]) {
                productElements[index].style.position = 'relative';
                productElements[index].appendChild(indicator);
            }
        });
    }

    function clearHighlights() {
        const indicators = document.querySelectorAll('.shein-importer-indicator');
        indicators.forEach(indicator => indicator.remove());
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();