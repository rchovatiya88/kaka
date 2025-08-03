# AI Storybook Generator - Shopify Integration Project

## Project Context
You are working on migrating an AI Storybook Generator from a standalone React + Python FastAPI application (`kakafullstack`) into a Shopify Remix App (`kaka`). This migration consolidates authentication, payments, and infrastructure into Shopify's ecosystem.

## Current State (kakafullstack)
- **Frontend**: React + Vite + Clerk Authentication
- **Backend**: Python FastAPI + MongoDB Atlas
- **Payments**: Direct Stripe integration
- **Storage**: MongoDB + GridFS for stories and assets
- **Authentication**: Clerk (separate user management)

## Target State (kaka - Shopify App)
- **Frontend**: Remix React + Shopify App Bridge
- **Backend**: Remix API Routes + Node.js
- **Payments**: Shopify Products + Checkout
- **Storage**: PostgreSQL/SQLite via Prisma + Shopify Metafields
- **Authentication**: Shopify Customer Accounts

## Core Features
1. **Story Generation**: AI-powered children's story creation
2. **Customization**: Character names, themes, moral lessons
3. **Illustrations**: AI-generated images for each story page
4. **Audio Narration**: Text-to-speech for story reading
5. **PDF Export**: Downloadable story books
6. **Multi-language**: Support for multiple languages
7. **Purchase Flow**: Buy generated stories as Shopify products

## Key Technologies
- **AI Text**: Google Generative AI / OpenAI
- **AI Images**: DALL-E / Stable Diffusion / Midjourney API
- **Framework**: Remix (React + Node.js)
- **Database**: Prisma ORM with PostgreSQL/SQLite
- **Platform**: Shopify (Admin API, Storefront API, App Bridge)
- **File Generation**: React PDF, Puppeteer
- **Audio**: Google Text-to-Speech / ElevenLabs

## Business Model
- Customers create personalized AI stories
- Each story becomes a Shopify product
- Customers purchase stories through Shopify checkout
- Digital delivery of PDF and audio files
- Potential for physical book printing integration

## Migration Status
- [ ] Phase 1: Database Schema Migration
- [ ] Phase 2: Core Story Generation
- [ ] Phase 3: Frontend Integration
- [ ] Phase 4: Shopify Integration
- [ ] Phase 5: Advanced Features

## Important Considerations
1. **Data Migration**: Existing stories need to be migrated from MongoDB to PostgreSQL
2. **Customer Matching**: Link existing Clerk users to Shopify customers
3. **API Rate Limits**: Handle Shopify API and AI service limits
4. **Performance**: Optimize for story generation time
5. **Cost Management**: Monitor AI API usage and costs

## Development Approach
- Incremental migration with feature flags
- Maintain backward compatibility during transition
- Test thoroughly in Shopify development stores
- Monitor performance and error rates
- Document all API changes

## Success Metrics
- Reduced authentication complexity
- Improved conversion rates
- Lower operational costs
- Better user experience
- Simplified maintenance