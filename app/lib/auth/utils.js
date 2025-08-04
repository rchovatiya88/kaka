// Authentication utility functions

import { json } from "@remix-run/node";
import { createErrorResponse } from "../api/types";
import { 
  authenticateAndGetUser, 
  requireRole, 
  requireOwnership,
  rateLimit,
  authenticateApiKey
} from "./middleware";

/**
 * Higher-order function to wrap route handlers with authentication
 */
export function withAuth(handler, options = {}) {
  return async (args) => {
    try {
      const { request } = args;
      
      // Rate limiting
      if (options.rateLimit !== false) {
        const identifier = request.headers.get("x-forwarded-for") || "anonymous";
        rateLimit(request, identifier);
      }
      
      // Authentication
      let authContext;
      if (options.apiKey) {
        authContext = await authenticateApiKey(request);
      } else {
        authContext = await authenticateAndGetUser(request);
      }
      
      // Role-based authorization
      if (options.roles) {
        await requireRole(options.roles)(request, authContext);
      }
      
      // Resource ownership check
      if (options.ownership) {
        const { resourceType, resourceIdParam } = options.ownership;
        const resourceId = args.params[resourceIdParam];
        await requireOwnership(resourceType, resourceId, authContext.user.id);
      }
      
      // Call the original handler with auth context
      return await handler({
        ...args,
        auth: authContext
      });
      
    } catch (error) {
      console.error("Auth wrapper error:", error);
      
      if (error.message.includes("Authentication failed")) {
        return json(createErrorResponse("Authentication required"), { status: 401 });
      }
      
      if (error.message.includes("Access denied") || 
          error.message.includes("Resource not found or access denied")) {
        return json(createErrorResponse("Access denied"), { status: 403 });
      }
      
      if (error.message.includes("Rate limit exceeded")) {
        return json(createErrorResponse("Rate limit exceeded"), { status: 429 });
      }
      
      return json(createErrorResponse(error.message), { status: 500 });
    }
  };
}

/**
 * Utility to check if user has permission for action
 */
export function hasPermission(user, action, resource = null) {
  const permissions = {
    'owner': ['*'], // Owner can do everything
    'admin': [
      'story:create', 'story:read', 'story:update', 'story:delete',
      'user:read', 'user:update',
      'shop:read', 'shop:update'
    ],
    'user': [
      'story:create', 'story:read:own', 'story:update:own', 'story:delete:own',
      'user:read:own', 'user:update:own'
    ]
  };
  
  const userPermissions = permissions[user.role] || [];
  
  // Check for wildcard permission
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check for exact action match
  if (userPermissions.includes(action)) {
    return true;
  }
  
  // Check for resource-specific permissions (e.g., 'story:read:own')
  if (resource && userPermissions.includes(`${action}:own`)) {
    return resource.userId === user.id;
  }
  
  return false;
}

/**
 * Generate secure share tokens
 */
export function generateShareToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * JWT token utilities (for future API expansion)
 */
export function generateJWT(payload, expiresIn = '24h') {
  // TODO: Implement JWT generation if needed for API expansion
  // For now, Shopify handles all authentication
  return null;
}

/**
 * Session utilities
 */
export function getSessionInfo(session) {
  return {
    shop: session.shop,
    userId: session.userId,
    isOnline: session.isOnline,
    scope: session.scope,
    email: session.email,
    accountOwner: session.accountOwner
  };
}

/**
 * Audit log utility for security-sensitive actions
 */
export async function logSecurityEvent(action, user, details = {}) {
  // TODO: Implement audit logging
  console.log(`AUDIT: ${action}`, {
    userId: user.id,
    userEmail: user.email,
    shopId: user.shopId,
    timestamp: new Date().toISOString(),
    ...details
  });
}