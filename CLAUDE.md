# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Strapi v5 CMS backend application for Karunia Motor, appearing to be a blog/CMS system for a motor-related business. The project uses TypeScript and supports multiple database backends (PostgreSQL, MySQL, SQLite).

## Development Commands

### Core Strapi Commands
- `npm run develop` - Start Strapi in development mode with auto-reload enabled
- `npm run start` - Start Strapi in production mode (requires built admin panel)
- `npm run build` - Build the admin panel for production
- `npm run console` - Open Strapi console for debugging/data manipulation

### Database & Deployment
- `npm run deploy` - Deploy to Strapi Cloud or configured deployment target
- `npm run seed:example` - Run seed script to populate with example data

### Maintenance
- `npm run upgrade` - Upgrade Strapi to latest version
- `npm run upgrade:dry` - Preview upgrade without applying changes

## Architecture

### Content Structure
The CMS manages the following content types:
- **Articles**: Blog posts with rich content including cover images, author relationships, categories, and dynamic blocks
- **Authors**: Writer profiles linked to articles
- **Categories**: Article categorization
- **About**: Static content type
- **Global**: Site-wide configuration and content

### Dynamic Components
Articles use a dynamiczone containing:
- `shared.media` - Media embeds
- `shared.quote` - Quote blocks
- `shared.rich-text` - Rich text content
- `shared.slider` - Image/carousel sliders

### Database Configuration
- Default: SQLite for development (`.tmp/data.db`)
- Production ready: PostgreSQL (v8.8.0) or MySQL support
- Environment-based configuration via `.env` file
- Connection pooling configured (min: 2, max: 10)

### Data Seeding
- `npm run seed:example` imports sample data from `data/data.json`
- Includes: articles with images, categories, authors with avatars, global site settings, and about page content
- Automatically sets public permissions for API access (find, findOne operations)
- Uploads media files from `data/uploads/` directory

### TypeScript Configuration
- Target: ES2019 with CommonJS modules
- Strict mode disabled for flexibility
- Source located in `src/` directory
- Admin build excluded from server compilation

### Environment Variables
Key environment variables for configuration:
- `DATABASE_CLIENT` - Database type (sqlite, postgres, mysql)
- `DATABASE_URL` - Full connection string (overrides other DB settings)
- `DATABASE_HOST` - Database host (default: localhost)
- `DATABASE_PORT` - Database port
- `DATABASE_NAME` - Database name
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `DATABASE_SSL` - Enable SSL connection
- `DATABASE_FILENAME` - SQLite database file path

## Key Directories
- `src/api/` - Content type definitions and API configurations (articles, authors, categories, etc.)
- `src/components/` - Reusable components and schemas (shared.media, shared.quote, shared.rich-text, shared.slider)
- `config/` - Strapi configuration files (database.ts, server.ts, plugins.ts, etc.)
- `scripts/` - Custom scripts including data seeding (seed.js)
- `data/` - Seed data files including JSON data and upload assets
- `database/` - Database migrations and data
- `public/` - Publicly accessible assets and uploads