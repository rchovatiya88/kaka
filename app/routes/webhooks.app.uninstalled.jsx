import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const { shop, session, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    // Clean up all data related to this shop
    if (session) {
      // Delete sessions
      await prisma.session.deleteMany({ where: { shop } });
    }

    // Find and deactivate the shop
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: shop }
    });

    if (shopRecord) {
      // Deactivate shop instead of deleting to preserve data integrity
      await prisma.shop.update({
        where: { id: shopRecord.id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Deactivate all users for this shop
      await prisma.user.updateMany({
        where: { shopId: shopRecord.id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      console.log(`Deactivated shop ${shop} and associated users`);
    }

    return new Response("OK");
    
  } catch (error) {
    console.error("App uninstalled webhook error:", error);
    return new Response("Error", { status: 500 });
  }
};
