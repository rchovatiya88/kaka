# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify app built with Remix, using the official Shopify app template. The app is configured for embedded installation in Shopify Admin and uses Prisma with SQLite for session storage.

## Development Commands

### Primary Development
- `npm run dev` - Start development server using Shopify CLI (includes tunneling and hot reload)
- `npm run build` - Build the app for production using Remix
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database Management
- `npm run setup` - Initialize database (runs `prisma generate && prisma migrate deploy`)
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate deploy` - Deploy database migrations
- `npx prisma studio` - Open Prisma Studio for database inspection

### Shopify CLI Commands
- `npm run deploy` - Deploy app to Shopify
- `npm run config:link` - Link app configuration
- `npm run config:use` - Use specific app configuration
- `npm run generate` - Generate Shopify app components
- `npm run env` - Manage environment variables

## Architecture

### Core Framework Stack
- **Frontend**: Remix (React framework) with Vite for bundling
- **UI Components**: Shopify Polaris design system
- **App Integration**: Shopify App Bridge for embedded app functionality
- **Database**: Prisma ORM with SQLite (development) 
- **Authentication**: Shopify OAuth with session storage via Prisma

### Key Files and Structure
- `app/shopify.server.js` - Main Shopify app configuration and authentication setup
- `app/db.server.js` - Database connection and Prisma client
- `app/routes/` - Remix route handlers (file-based routing)
- `prisma/schema.prisma` - Database schema definition
- `shopify.app.toml` - Shopify app configuration (scopes, webhooks, etc.)

### Authentication Flow
The app uses Shopify's embedded app authentication pattern:
1. OAuth handled by `@shopify/shopify-app-remix`
2. Sessions stored in SQLite via Prisma adapter
3. Admin API access through GraphQL with automatic token management

### API Integration
- Uses Shopify Admin GraphQL API (January 2025 version)
- Authentication handled via `authenticate.admin(request)` in route loaders/actions
- App Bridge integration for seamless Shopify Admin UI

### Database Notes
- Currently uses SQLite for development (single file: `prisma/dev.sqlite`)
- Session storage managed by `@shopify/shopify-app-session-storage-prisma`
- For production, consider migrating to PostgreSQL/MySQL for better scalability

## Configuration Files
- `remix.config.js` - Remix framework configuration  
- `vite.config.js` - Vite bundler settings with Shopify-specific HMR setup
- `tsconfig.json` - TypeScript configuration (supports both .ts and .jsx files)
- `.eslintrc.cjs` - ESLint configuration with Remix and Shopify presets

## Environment Variables Required
- `SHOPIFY_API_KEY` - App's API key from Partner Dashboard
- `SHOPIFY_API_SECRET` - App's secret key
- `SCOPES` - Comma-separated list of required permissions (currently: "write_products")
- `SHOPIFY_APP_URL` - App's public URL (auto-managed by CLI during development)

## Development Notes
- The app runs embedded in Shopify Admin by default
- Local development uses Cloudflare tunnels via Shopify CLI
- Hot module replacement configured for both localhost and tunnel environments
- App uses Remix's file-based routing system in `app/routes/`
- Webhooks are configured in `shopify.app.toml` and handled in corresponding route files