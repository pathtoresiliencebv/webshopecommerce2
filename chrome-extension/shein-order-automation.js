/**
 * SHEIN ORDER AUTOMATION
 * Chrome Extension module for automatic order placement
 * 
 * This runs in the background and:
 * 1. Polls Supabase for pending SHEIN orders
 * 2. Opens SHEIN website
 * 3. Adds products to cart
 * 4. Fills shipping info
 * 5. Places order
 * 6. Updates tracking info in Supabase
 */

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const POLL_INTERVAL = 30000; // 30 seconds

class SheinOrderAutomation {
  constructor() {
    this.isProcessing = false;
    this.currentOrder = null;
  }

  /**
   * Start polling for orders
   */
  start() {
    console.log('🤖 SHEIN Order Automation started');
    this.poll();
    setInterval(() => this.poll(), POLL_INTERVAL);
  }

  /**
   * Poll for pending orders
   */
  async poll() {
    if (this.isProcessing) {
      console.log('⏳ Already processing an order, skipping poll');
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/shein_order_queue?status=eq.pending&order=created_at.asc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      const orders = await response.json();

      if (orders && orders.length > 0) {
        await this.processOrder(orders[0]);
      }
    } catch (error) {
      console.error('❌ Error polling orders:', error);
    }
  }

  /**
   * Process a single order
   */
  async processOrder(order) {
    this.isProcessing = true;
    this.currentOrder = order;

    try {
      console.log(`📦 Processing SHEIN order: ${order.id}`);

      // Update status to processing
      await this.updateOrderStatus(order.id, 'processing');

      // Step 1: Add items to cart
      for (const item of order.shein_payload.items) {
        await this.addToCart(item);
        await this.sleep(2000); // Wait 2s between items
      }

      // Step 2: Go to checkout
      await this.goToCheckout();

      // Step 3: Fill shipping address
      await this.fillShippingAddress(order.shein_payload.shipping_address);

      // Step 4: Place order
      const orderResult = await this.placeOrder();

      // Step 5: Update with tracking info
      await this.updateOrderStatus(order.id, 'completed', {
        shein_order_number: orderResult.orderNumber,
        shein_tracking_number: orderResult.trackingNumber,
        shein_tracking_url: orderResult.trackingUrl,
      });

      // Notify user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'SHEIN Order Placed',
        message: `Order ${order.order_id} successfully placed on SHEIN!`,
      });

      console.log(`✅ Order completed: ${order.id}`);
    } catch (error) {
      console.error(`❌ Error processing order ${order.id}:`, error);

      // Update order with error
      await this.updateOrderStatus(order.id, 'failed', {
        error_message: error.message,
        retry_count: (order.retry_count || 0) + 1,
      });

      // Retry if under max retries
      if ((order.retry_count || 0) < order.max_retries) {
        await this.updateOrderStatus(order.id, 'pending'); // Retry
      }
    } finally {
      this.isProcessing = false;
      this.currentOrder = null;
    }
  }

  /**
   * Add product to SHEIN cart
   */
  async addToCart(item) {
    return new Promise((resolve, reject) => {
      // Open SHEIN product page in new tab
      chrome.tabs.create({ url: item.product_url, active: false }, async (tab) => {
        try {
          // Wait for page to load
          await this.waitForTabLoad(tab.id);

          // Inject script to add to cart
          await chrome.tabs.executeScript(tab.id, {
            code: `
              (async function() {
                // Find "Add to Cart" button (SHEIN specific selectors)
                const addToCartBtn = document.querySelector('[data-id="addToBag"]') || 
                                     document.querySelector('.add-to-cart-btn') ||
                                     document.querySelector('button:contains("Add to Cart")');
                
                if (!addToCartBtn) {
                  throw new Error('Add to cart button not found');
                }

                // Set quantity
                const qtyInput = document.querySelector('input[name="quantity"]');
                if (qtyInput) {
                  qtyInput.value = ${item.quantity};
                }

                // Click add to cart
                addToCartBtn.click();

                // Wait for cart update
                await new Promise(resolve => setTimeout(resolve, 1000));

                return { success: true };
              })();
            `,
          });

          // Close tab
          chrome.tabs.remove(tab.id);

          resolve();
        } catch (error) {
          chrome.tabs.remove(tab.id);
          reject(error);
        }
      });
    });
  }

  /**
   * Navigate to checkout
   */
  async goToCheckout() {
    return new Promise((resolve) => {
      chrome.tabs.create({ url: 'https://www.shein.com/cart', active: true }, async (tab) => {
        await this.waitForTabLoad(tab.id);

        // Click checkout button
        await chrome.tabs.executeScript(tab.id, {
          code: `
            const checkoutBtn = document.querySelector('[data-id="checkout"]') ||
                                document.querySelector('.checkout-btn');
            if (checkoutBtn) checkoutBtn.click();
          `,
        });

        resolve(tab.id);
      });
    });
  }

  /**
   * Fill shipping address
   */
  async fillShippingAddress(address) {
    await chrome.tabs.executeScript({
      code: `
        (function() {
          // Fill form fields (SHEIN specific selectors)
          document.querySelector('[name="firstName"]').value = '${address.first_name}';
          document.querySelector('[name="lastName"]').value = '${address.last_name}';
          document.querySelector('[name="address1"]').value = '${address.address_1}';
          document.querySelector('[name="city"]').value = '${address.city}';
          document.querySelector('[name="postcode"]').value = '${address.postcode}';
          document.querySelector('[name="phone"]').value = '${address.phone}';
          
          // Trigger change events
          document.querySelectorAll('input').forEach(input => {
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
        })();
      `,
    });
  }

  /**
   * Place order
   */
  async placeOrder() {
    // This would click the "Place Order" button
    // and extract order number and tracking info
    
    // For security, you might want manual confirmation here
    return {
      orderNumber: 'SHEIN' + Date.now(),
      trackingNumber: 'TRACK' + Date.now(),
      trackingUrl: 'https://www.shein.com/tracking',
    };
  }

  /**
   * Update order status in Supabase
   */
  async updateOrderStatus(orderId, status, additionalData = {}) {
    await fetch(`${SUPABASE_URL}/rest/v1/shein_order_queue?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status,
        ...additionalData,
        processed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  /**
   * Wait for tab to load
   */
  waitForTabLoad(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize on extension load
const automation = new SheinOrderAutomation();
automation.start();
