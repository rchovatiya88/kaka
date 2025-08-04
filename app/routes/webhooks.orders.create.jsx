import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);
    
    console.log(`Received ${topic} webhook for ${shop}`);
    
    // Check if this order contains story products
    const lineItems = payload.line_items || [];
    const storyItems = lineItems.filter(item => 
      item.product_type === "Digital Story" || 
      (item.properties && item.properties.some(prop => prop.name === "_story_id"))
    );
    
    if (storyItems.length === 0) {
      return new Response("OK - No story items");
    }
    
    // Find the shop record
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: shop }
    });
    
    if (!shopRecord) {
      console.log(`Shop ${shop} not found in database`);
      return new Response("OK - Shop not found");
    }
    
    // Process each story item
    for (const storyItem of storyItems) {
      try {
        // Extract story ID from line item properties
        const storyIdProperty = storyItem.properties?.find(prop => prop.name === "_story_id");
        
        if (storyIdProperty) {
          const storyId = storyIdProperty.value;
          
          // Update story status to indicate it's been purchased
          await prisma.story.update({
            where: { id: storyId },
            data: {
              metadata: {
                ...storyRecord?.metadata,
                orderId: payload.id,
                orderNumber: payload.order_number,
                purchasedAt: new Date(payload.created_at),
                customerEmail: payload.customer?.email
              }
            }
          });
          
          console.log(`Updated story ${storyId} with order ${payload.order_number}`);
        }
        
      } catch (error) {
        console.error(`Failed to process story item:`, error);
      }
    }
    
    return new Response("OK");
    
  } catch (error) {
    console.error("Order created webhook error:", error);
    return new Response("Error", { status: 500 });
  }
};