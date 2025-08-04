// API Route: Create Checkout Session
// File: app/routes/api.create-checkout.jsx

import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    const body = await request.json();
    const { product_id, variant_id, quantity = 1 } = body;

    if (!product_id || !variant_id) {
      return json({ error: "Missing product or variant ID" }, { status: 400 });
    }

    // Create a draft order for immediate checkout
    const draftOrderData = {
      line_items: [
        {
          variant_id: variant_id,
          quantity: quantity
        }
      ],
      use_customer_default_address: true,
      email: null, // Will be collected at checkout
      tax_exempt: false,
      currency: 'USD',
      invoice_sent_at: null,
      tags: 'ai-generated-story,custom-order',
      note: 'Personalized AI-generated storybook',
      // Auto-generate invoice URL for checkout
      billing_address: {
        // Will be collected at checkout
      },
      shipping_address: {
        // Digital product - no shipping needed
      }
    };

    // Create draft order
    const draftOrderResponse = await admin.rest.resources.DraftOrder.save({
      session: admin.session,
      ...draftOrderData
    });

    if (!draftOrderResponse.success) {
      throw new Error("Failed to create draft order");
    }

    const draftOrder = draftOrderResponse.body.draft_order;

    // Generate invoice URL for checkout
    const invoiceResponse = await admin.rest.resources.DraftOrder.save({
      session: admin.session,
      id: draftOrder.id
    });

    // Complete the draft order to create checkout
    const checkoutResponse = await fetch(`https://${admin.session.shop}/admin/api/2023-07/draft_orders/${draftOrder.id}/complete.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': admin.session.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!checkoutResponse.ok) {
      // Alternative: Use the invoice URL
      const invoiceUrl = draftOrder.invoice_url;
      
      return json({
        checkout_url: invoiceUrl,
        draft_order_id: draftOrder.id,
        order_total: draftOrder.total_price,
        currency: draftOrder.currency
      });
    }

    const checkoutData = await checkoutResponse.json();
    
    return json({
      checkout_url: checkoutData.order?.order_status_url || draftOrder.invoice_url,
      order_id: checkoutData.order?.id,
      draft_order_id: draftOrder.id,
      order_total: draftOrder.total_price,
      currency: draftOrder.currency
    });

  } catch (error) {
    console.error("Error creating checkout:", error);
    return json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
};
