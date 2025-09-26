// SHEIN Product Importer - Background Service Worker

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('SHEIN Product Importer installed:', details);
    
    // Set up context menus
    setupContextMenus();
    
    // Initialize storage
    initializeStorage();
});

// Set up context menus
function setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
        // Add context menu for SHEIN pages
        chrome.contextMenus.create({
            id: 'import-product',
            title: 'Import this product to Aurelio Living',
            contexts: ['page', 'selection', 'image'],
            documentUrlPatterns: ['*://*.shein.com/*']
        });

        chrome.contextMenus.create({
            id: 'import-all-products',
            title: 'Import all products on this page',
            contexts: ['page'],
            documentUrlPatterns: ['*://*.shein.com/*']
        });

        chrome.contextMenus.create({
            id: 'separator1',
            type: 'separator',
            contexts: ['page'],
            documentUrlPatterns: ['*://*.shein.com/*']
        });

        chrome.contextMenus.create({
            id: 'open-admin',
            title: 'Open Aurelio Living Admin',
            contexts: ['page'],
            documentUrlPatterns: ['*://*.shein.com/*']
        });
    });
}

// Initialize storage with default values
async function initializeStorage() {
    const defaultSettings = {
        autoApprove: false,
        priceAdjustment: {
            type: 'none',
            value: 0
        },
        importSettings: {
            maxProducts: 50,
            includeSoldOut: false,
            minRating: 0
        },
        apiEndpoint: 'https://ppvxydvbgbipvgvgaeja.supabase.co/functions/v1'
    };

    const stored = await chrome.storage.local.get(['settings']);
    if (!stored.settings) {
        await chrome.storage.local.set({ settings: defaultSettings });
    }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case 'import-product':
            await handleImportProduct(tab, info);
            break;
            
        case 'import-all-products':
            await handleImportAllProducts(tab);
            break;
            
        case 'open-admin':
            await handleOpenAdmin();
            break;
    }
});

// Handle import single product
async function handleImportProduct(tab, info) {
    try {
        // Check if user is logged in
        const stored = await chrome.storage.local.get(['authToken']);
        if (!stored.authToken) {
            // Open popup for login
            chrome.action.openPopup();
            return;
        }

        // Extract product from current page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractCurrentProduct,
            args: [info.selectionText, info.srcUrl]
        });

        if (results && results[0] && results[0].result) {
            const product = results[0].result;
            await importSingleProduct(product, stored.authToken);
            showNotification('Product imported successfully!', 'success');
        } else {
            showNotification('Could not extract product data', 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Import failed: ' + error.message, 'error');
    }
}

// Handle import all products
async function handleImportAllProducts(tab) {
    try {
        // Check if user is logged in
        const stored = await chrome.storage.local.get(['authToken']);
        if (!stored.authToken) {
            chrome.action.openPopup();
            return;
        }

        // Show loading notification
        showNotification('Scanning page for products...', 'info');

        // Extract all products from current page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractAllProducts
        });

        if (results && results[0] && results[0].result && results[0].result.length > 0) {
            const products = results[0].result;
            await importMultipleProducts(products, stored.authToken);
            showNotification(`Successfully imported ${products.length} products!`, 'success');
        } else {
            showNotification('No products found on this page', 'warning');
        }
    } catch (error) {
        console.error('Bulk import error:', error);
        showNotification(`Bulk import failed: ${error.message}`, 'error');
    }
}

// Handle open admin
async function handleOpenAdmin() {
    // Open Aurelio Living admin in new tab
    chrome.tabs.create({
        url: 'https://aurelioliving.myaurelio.com/admin'
    });
}

// Extract current product (injected function)
function extractCurrentProduct(selectionText, srcUrl) {
    // This function runs in the page context
    const product = {
        id: `shein_${Date.now()}`,
        url: window.location.href,
        name: document.querySelector('h1, .product-title, .goods-title')?.textContent?.trim() || '',
        price: 0,
        currency: 'USD',
        description: selectionText || document.querySelector('.product-intro, .goods-desc')?.textContent?.trim() || '',
        images: [],
        category: ''
    };

    // Extract price
    const priceEl = document.querySelector('.price, .sale-price, .current-price');
    if (priceEl) {
        const priceText = priceEl.textContent.replace(/[^\\d.,]/g, '');
        product.price = parseFloat(priceText.replace(',', '.')) || 0;
    }

    // Extract images
    const imageSelectors = [
        'img[src*="goods_img"]',
        '.product-image img',
        '.goods-image img',
        '.crop-image-container img'
    ];

    for (const selector of imageSelectors) {
        const images = Array.from(document.querySelectorAll(selector))
            .map(img => img.src)
            .filter(src => src && !src.includes('placeholder'));
        if (images.length > 0) {
            product.images = images.slice(0, 5);
            break;
        }
    }

    // If user right-clicked on an image, prioritize it
    if (srcUrl && srcUrl.includes('shein')) {
        product.images.unshift(srcUrl);
        product.images = [...new Set(product.images)]; // Remove duplicates
    }

    return product.name && product.price > 0 ? product : null;
}

// Extract all products (injected function)
function extractAllProducts() {
    // This function runs in the page context
    const products = [];

    // Try different selectors for product items
    const productSelectors = [
        '.product-item',
        '.goods-item',
        '.item-card',
        '[data-testid="product-item"]'
    ];

    for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) continue;

        elements.forEach((element, index) => {
            try {
                const nameEl = element.querySelector('h3, h4, .product-title, .goods-title, .item-title');
                const priceEl = element.querySelector('.price, .sale-price, .current-price');
                const linkEl = element.querySelector('a');
                const imageEl = element.querySelector('img');

                if (nameEl && priceEl && linkEl) {
                    const priceText = priceEl.textContent.replace(/[^\\d.,]/g, '');
                    const price = parseFloat(priceText.replace(',', '.'));

                    if (price > 0) {
                        products.push({
                            id: `shein_bulk_${index}_${Date.now()}`,
                            url: linkEl.href,
                            name: nameEl.textContent.trim(),
                            price: price,
                            currency: 'USD',
                            description: '',
                            images: imageEl ? [imageEl.src] : [],
                            category: ''
                        });
                    }
                }
            } catch (error) {
                console.warn('Error extracting product:', error);
            }
        });

        if (products.length > 0) break; // Use first successful selector
    }

    return products;
}

// Import single product
async function importSingleProduct(product, authToken) {
    const response = await fetch('https://ppvxydvbgbipvgvgaeja.supabase.co/functions/v1/shein-import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            products: [product],
            import_settings: {
                auto_approve: false
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
    }

    return await response.json();
}

// Import multiple products
async function importMultipleProducts(products, authToken) {
    // Get user settings
    const stored = await chrome.storage.local.get(['settings']);
    const settings = stored.settings || {};

    const response = await fetch('https://ppvxydvbgbipvgvgaeja.supabase.co/functions/v1/shein-import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            products: products.slice(0, settings.importSettings?.maxProducts || 50),
            import_settings: {
                auto_approve: settings.autoApprove || false,
                price_adjustment: settings.priceAdjustment
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bulk import failed');
    }

    return await response.json();
}

// Show notification
function showNotification(message, type = 'info') {
    const iconMap = {
        success: 'icons/icon32.png',
        error: 'icons/icon32.png',
        warning: 'icons/icon32.png',
        info: 'icons/icon32.png'
    };

    chrome.notifications.create({
        type: 'basic',
        iconUrl: iconMap[type],
        title: 'SHEIN Product Importer',
        message: message
    });
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'openPopup':
            chrome.action.openPopup();
            break;
            
        case 'showNotification':
            showNotification(request.message, request.type);
            break;
            
        case 'openTab':
            chrome.tabs.create({ url: request.url });
            break;
            
        case 'getTabInfo':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    sendResponse({
                        url: tabs[0].url,
                        title: tabs[0].title,
                        isSheinPage: tabs[0].url.includes('shein.com')
                    });
                } else {
                    sendResponse({ isSheinPage: false });
                }
            });
            return true; // Keep message channel open
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This won't be called if popup is defined, but keeping for completeness
    if (tab.url.includes('shein.com')) {
        chrome.action.openPopup();
    } else {
        chrome.tabs.create({
            url: 'https://shein.com'
        });
    }
});

// Handle tab updates to show/hide page action
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('shein.com')) {
            // Enable extension on SHEIN pages
            chrome.action.enable(tabId);
        } else {
            // Keep extension enabled for all tabs (user might want to configure it)
            chrome.action.enable(tabId);
        }
    }
});

// Cleanup on extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('SHEIN Product Importer starting up...');
});

// Keep service worker alive
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();
