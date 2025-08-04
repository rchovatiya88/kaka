import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createSuccessResponse, createErrorResponse } from "../lib/api/types";

// GET /api/v1/stories/:id - Get specific story with all pages
export async function loader({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const { id } = params;
    
    if (!id) {
      return json(createErrorResponse("Story ID is required"), { status: 400 });
    }
    
    // Get user to verify ownership
    const user = await getOrCreateUser(session);
    
    // Get story with all pages and related data
    const story = await prisma.story.findFirst({
      where: {
        id,
        userId: user.id // Ensure user owns this story
      },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: {
            images: true,
            audioFiles: true
          }
        },
        template: true,
        images: true,
        audioFiles: true,
        shares: {
          where: {
            expiresAt: {
              gte: new Date()
            }
          }
        }
      }
    });
    
    if (!story) {
      return json(createErrorResponse("Story not found"), { status: 404 });
    }
    
    return json(createSuccessResponse({ story }));
    
  } catch (error) {
    console.error("Story fetch error:", error);
    return json(createErrorResponse(error), { status: 500 });
  }
}

// PUT /api/v1/stories/:id - Update story
export async function action({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const { id } = params;
    
    if (!id) {
      return json(createErrorResponse("Story ID is required"), { status: 400 });
    }
    
    if (request.method === "PUT") {
      return await updateStory(request, id, session);
    } else if (request.method === "DELETE") {
      return await deleteStory(request, id, session);
    }
    
    return json(createErrorResponse("Method not allowed"), { status: 405 });
    
  } catch (error) {
    console.error("Story action error:", error);
    return json(createErrorResponse(error), { status: 500 });
  }
}

async function updateStory(request, storyId, session) {
  const user = await getOrCreateUser(session);
  const updateData = await request.json();
  
  // Verify story ownership
  const existingStory = await prisma.story.findFirst({
    where: {
      id: storyId,
      userId: user.id
    }
  });
  
  if (!existingStory) {
    return json(createErrorResponse("Story not found"), { status: 404 });
  }
  
  // Update story
  const story = await prisma.story.update({
    where: { id: storyId },
    data: {
      ...updateData,
      updatedAt: new Date()
    },
    include: {
      pages: {
        orderBy: { pageNumber: 'asc' }
      }
    }
  });
  
  return json(createSuccessResponse({ story }));
}

async function deleteStory(request, storyId, session) {
  const user = await getOrCreateUser(session);
  
  // Verify story ownership
  const existingStory = await prisma.story.findFirst({
    where: {
      id: storyId,
      userId: user.id
    }
  });
  
  if (!existingStory) {
    return json(createErrorResponse("Story not found"), { status: 404 });
  }
  
  // Delete story (cascade will handle related records)
  await prisma.story.delete({
    where: { id: storyId }
  });
  
  return json(createSuccessResponse({ 
    message: "Story deleted successfully" 
  }));
}

// Shared helper function (should be extracted to utils)
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