# THREADS AI

THREADS AI is an AI-assisted fashion styling and wardrobe web application.

## Project structure

- `public/` — browser interface, stylesheets, and the Three.js dress-form scene
- `api/` — authenticated server endpoints for styling, vision, wardrobe, profile, collections, virtual try-on, and admin features
- `lib/` — shared server utilities
- `migrations/` — SQL schema and incremental database migrations
- `hatchable.toml` — Hatchable project configuration

## Development and deployment

This source was exported from the Hatchable project. It uses Hatchable's server runtime and SDK (`hatchable`) for authentication, database access, storage, and AI integrations.

To run it as intended, import or deploy it through a compatible Hatchable project. A plain static GitHub Pages deployment will not run the authenticated API routes.

## Required configuration

Configure provider credentials and service integrations in the hosting platform's secret/environment settings. Do not commit API keys, passwords, access tokens, or private environment files.

Some integrations require their own provider credentials (for example, the AI text/image provider and virtual try-on provider). Availability depends on the configured services.

## Database

Apply the SQL migrations in `migrations/` in numeric order in the target project's database. Review the migration state before applying them to an existing database.

## Source note

This repository contains the application source files exported from the THREADS AI Hatchable project. Platform-managed secrets, user data, and private runtime configuration are intentionally excluded.
