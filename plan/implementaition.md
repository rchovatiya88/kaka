# AI Storybook Generator - Shopify Integration Migration Plan

## Overview
This plan migrates the story generation functionality from `kakafullstack` (React + Python FastAPI + MongoDB + Clerk) into `kaka` (Shopify Remix App), eliminating the need for separate authentication and database systems.

## Architecture Changes

### Before (kakafullstack)
- **Frontend**: React + Vite + Clerk Auth
- **Backend**: Python FastAPI + MongoDB Atlas
- **Auth**: Clerk
- **Payments**: Direct Stripe integration
- **Storage**: MongoDB + GridFS

### After (kaka - Shopify App)
- **Frontend**: Remix React + Shopify App Bridge
- **Backend**: Remix API Routes + Node.js
- **Auth**: Shopify Authentication (customers/session)
- **Payments**: Shopify Products + Checkout
- **Storage**: PostgreSQL/SQLite via Prisma + Shopify Metafields

## Migration Phases

### Phase 1: Database Schema Migration
1. Extend Prisma schema with story models
2. Add story generation tables
3. Create migration scripts

### Phase 2: Core Story Generation
1. Convert Python story generation to Node.js
2. Implement Remix API routes
3. Integrate AI services (Google Generative AI, image generation)

### Phase 3: Frontend Integration
1. Adapt React components for Remix
2. Replace Clerk with Shopify authentication
3. Update routing and state management

### Phase 4: Shopify Integration
1. Product creation for generated stories
2. Customer data integration
3. Payment flow through Shopify checkout

### Phase 5: Advanced Features
1. PDF generation and download
2. Audio narration
3. Story customization
4. Multi-language support

## Key Benefits
- **Single Authentication**: Use Shopify customer accounts
- **Integrated Payments**: Shopify handles all transactions
- **Simplified Architecture**: One app instead of separate systems
- **Better User Experience**: Seamless flow from story creation to purchase
- **Shopify Ecosystem**: Access to Shopify's marketing, analytics, and tools

## Technical Stack Integration
- **Remix**: Server-side rendering + API routes
- **Shopify Admin API**: Product management, customer data
- **Shopify Storefront API**: Customer-facing operations
- **Prisma**: Database ORM for story data
- **Google Generative AI**: Story text generation
- **External Image API**: Story illustrations
- **Shopify Metafields**: Extended data storage

## Data Flow
1. Customer authenticates via Shopify
2. Story creation form (Remix page)
3. API routes generate story content
4. Story saved to Prisma database
5. Shopify product created automatically
6. Customer can purchase/download story
7. Order fulfillment with PDF delivery