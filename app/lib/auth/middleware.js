// Authentication and Authorization Middleware

import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createErrorResponse, USER_ROLES } from "./api/types";

/**
 * Enhanced authentication middleware that creates/updates user records
 * and provides consistent user context across the application
 */
export async function authenticateAndGetUser(request) {
  try {
    // Authenticate with Shopify
    const { session, admin } = await authenticate.admin(request);
    
    // Get or create shop record
    const shop = await prisma.shop.upsert({
      where: { shopDomain: session.shop },
      update: {
        shopName: session.shop,
        email: session.email,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shopDomain: session.shop,
        shopName: session.shop,
        email: session.email,
        isActive: true
      }
    });
    
    // Get or create user record
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
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shopId: shop.id,
        email: session.email || `${session.shop}@shopify.com`,
        firstName: session.firstName || null,
        lastName: session.lastName || null,
        role: session.accountOwner ? USER_ROLES.OWNER : USER_ROLES.USER
      }
    });
    
    return {
      session,
      admin,
      shop,
      user
    };
    
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error("Authentication failed");
  }
}

/**
 * Authorization middleware to check user permissions
 */
export function requireRole(allowedRoles = []) {
  return async (request, context) => {
    const { user } = context;
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
    
    return context;
  };
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(resourceType, resourceId, userId) {
  let resource;
  
  switch (resourceType) {
    case 'story':
      resource = await prisma.story.findFirst({
        where: { id: resourceId, userId }
      });
      break;
    case 'shop':
      resource = await prisma.shop.findFirst({
        where: { id: resourceId },
        include: {
          users: {
            where: { id: userId }
          }
        }
      });
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
  
  if (!resource) {
    throw new Error("Resource not found or access denied");
  }
  
  return resource;
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export function rateLimit(request, identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean old entries
  for (const [key, timestamps] of requestCounts.entries()) {
    requestCounts.set(key, timestamps.filter(t => t > windowStart));
    if (requestCounts.get(key).length === 0) {
      requestCounts.delete(key);
    }
  }
  
  // Check current requests
  const currentRequests = requestCounts.get(identifier) || [];
  
  if (currentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  
  // Add current request
  currentRequests.push(now);
  requestCounts.set(identifier, currentRequests);
  
  return true;
}

/**
 * API key authentication for external integrations
 */
export async function authenticateApiKey(request) {
  const apiKey = request.headers.get("x-api-key");
  
  if (!apiKey) {
    throw new Error("API key required");
  }
  
  // TODO: Implement API key validation
  // For now, return basic validation
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    throw new Error("Invalid API key");
  }
  
  return { apiKey, type: 'api_key' };
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(payload, signature, secret) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const calculatedSignature = hmac.digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}