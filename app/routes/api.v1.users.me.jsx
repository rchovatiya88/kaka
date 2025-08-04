import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createSuccessResponse, createErrorResponse } from "../lib/api/types";

// GET /api/v1/users/me - Get current user profile
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get or create user
    const user = await getOrCreateUser(session);
    
    // Get user with preferences and stats
    const userWithStats = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userPreferences: true,
        shop: {
          select: {
            shopDomain: true,
            shopName: true,
            shopSettings: true
          }
        },
        _count: {
          select: {
            stories: true
          }
        }
      }
    });
    
    // Get story stats
    const storyStats = await prisma.story.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { id: true }
    });
    
    const stats = {
      totalStories: userWithStats._count.stories,
      storysByStatus: storyStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {})
    };
    
    return json(createSuccessResponse({
      user: userWithStats,
      stats
    }));
    
  } catch (error) {
    console.error("User profile error:", error);
    return json(createErrorResponse(error), { status: 500 });
  }
}

// PUT /api/v1/users/me - Update user preferences
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    
    if (request.method !== "PUT") {
      return json(createErrorResponse("Method not allowed"), { status: 405 });
    }
    
    const user = await getOrCreateUser(session);
    const updateData = await request.json();
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        preferences: updateData.preferences,
        updatedAt: new Date()
      }
    });
    
    // Handle user preferences updates
    if (updateData.userPreferences) {
      for (const [key, value] of Object.entries(updateData.userPreferences)) {
        await prisma.userPreference.upsert({
          where: {
            userId_key: {
              userId: user.id,
              key
            }
          },
          update: {
            value,
            updatedAt: new Date()
          },
          create: {
            userId: user.id,
            key,
            value
          }
        });
      }
    }
    
    return json(createSuccessResponse({
      user: updatedUser,
      message: "Profile updated successfully"
    }));
    
  } catch (error) {
    console.error("User update error:", error);
    return json(createErrorResponse(error), { status: 500 });
  }
}

// Helper function to get or create user from session
async function getOrCreateUser(session) {
  const shop = await prisma.shop.upsert({
    where: { shopDomain: session.shop },
    update: {
      shopName: session.shop,
      email: session.email,
      isActive: true
    },
    create: {
      shopDomain: session.shop,
      shopName: session.shop,
      email: session.email,
      isActive: true
    }
  });
  
  const user = await prisma.user.upsert({
    where: { 
      shopId_email: { 
        shopId: shop.id, 
        email: session.email || `${session.shop}@shopify.com` 
      } 
    },
    update: {
      firstName: session.firstName,
      lastName: session.lastName,
      isActive: true
    },
    create: {
      shopId: shop.id,
      email: session.email || `${session.shop}@shopify.com`,
      firstName: session.firstName || null,
      lastName: session.lastName || null,
      role: session.accountOwner ? 'owner' : 'user'
    }
  });
  
  return user;
}