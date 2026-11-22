# THREADS AI — Your Style. Your Wardrobe. Your Creation.

THREADS AI is a personal fashion atelier for digital wardrobe management, AI styling, original garment concepts, fabric exploration and virtual try-on.

## Live application

- App: https://threads-ai.hatchable.site
- Project console: https://hatchable.com/console/projects/threads-ai

## Platform architecture

This ChatGPT-hosted build uses the Hatchable application runtime rather than a local Next.js/Supabase toolchain. The deployed project contains:

- Editorial HTML/CSS/JavaScript frontend with responsive layouts
- Three.js interactive dress-form scene (loaded from the Three.js CDN)
- Server-side JavaScript API handlers
- Managed PostgreSQL database and SQL migrations
- Passwordless email-code end-user authentication and optional passkeys
- Managed object storage for private user uploads
- Server-side AI gateway for language, vision and image generation
- FASHN REST adapter for real virtual try-on

The source files are available in the project console. There is no local `npm run dev` workflow for this hosted runtime; use the project console to inspect/export files and redeploy.

## First-time setup

1. Open the project console and finish the AI provider setup. The stylist currently uses an Anthropic Claude model. Image-based clothing/fabric/reference analysis uses Google Gemini (`gemini-2.5-flash`). Fashion concept image generation uses the configured image-generation model. Provider calls are server-side; do not put keys in browser code.
2. For virtual try-on, create a FASHN developer account, purchase API credits, create an API key, then add it as `FASHN_API_KEY` in the project Setup/Secrets area. The app uses the stable `tryon-v1.6` endpoint, stores the original images in private project storage, submits data URIs to FASHN, checks the prediction status, then copies the completed result into project storage.
3. The project is currently set to **personal/private visibility**. If other people should reach the app's own sign-up page, change project visibility to **Public** in the project console Settings. This is a deliberate owner action and cannot be changed from the application code. The temporary preview URL is not a substitute for public visibility.
4. Sign in through `/login` using an email one-time code. After the first sign-in, the page offers passkey enrollment when the browser supports it.

Provider references:

- FASHN API setup: https://docs.fashn.ai/getting-started/api-setup
- FASHN Virtual Try-On v1.6: https://docs.fashn.ai/api-reference/tryon-v1-6
- Open-Meteo forecast API: https://open-meteo.com/en/docs

## Feature status

| Module | Current status |
|---|---|
| Marketing landing page | Implemented; responsive editorial layout |
| 3D dress form | Implemented with a lathed torso/skirt form, stand, lighting and pointer response |
| Email sign-in | Platform auth wired to branded login page; requires public visibility for public signup |
| User profile | Editable style preferences plus private profile-photo upload (JPG/PNG/WebP, max 5 MB) |
| Digital wardrobe | Single and batch upload (up to 15 images), list, search, category filter, edit, favorite, delete; secure per-user storage |
| Clothing vision analysis | Gemini-backed endpoint; requires Google provider setup |
| AI outfit generator | Claude-backed; uses the user's wardrobe and saves selected wardrobe item IDs; requires Anthropic provider setup |
| Dressmaker text concepts | Claude-backed; saves design briefs and concepts |
| Fashion concept images | Image generation endpoint implemented; requires an enabled compatible image model/provider |
| Reference image analysis | Gemini-backed; requires Google provider setup |
| Fabric library | Upload, list and delete; secure per-user storage |
| Fabric analysis | Gemini-backed; requires Google provider setup |
| Clothing redesign | AI recommendations are saved in the redesign library |
| Virtual try-on | Real FASHN v1.6 API adapter implemented; requires FASHN API key and purchased credits |
| Style assistant | AI chat with conversation persistence; requires Anthropic provider setup |
| Weather-aware styling | User-consented browser geolocation + live Open-Meteo conditions |
| Saved creations | Outfit, design, fabric, try-on and redesign history; delete actions; named private collections with add/remove/rename/delete |
| Admin overview | Project-administrator-only endpoint and usage dashboard; not an in-app role editor |

## Database

Migrations:

- `001_threads_schema.sql` — profile foundation
- `002_threads_features.sql` — preferences, wardrobe, outfits, designs, try-ons, fabric, redesigns, conversations, collections, favorites, logs, reports, notifications and admin records
- `003_tryon_provider.sql` — provider prediction IDs and private input/result storage keys
- `004_rate_limits.sql` — per-user request windows

Private user tables declare row ownership rules (`read = "own"`, `write = "own"`). API routes also scope records by the authenticated user's ID. Admin reporting is restricted to project administrators and is separate from normal app-user access.

## API routes

- `GET/POST/PUT/DELETE /api/wardrobe`
- `GET/PUT /api/profile`
- `POST /api/style`
- `POST /api/generate-design`
- `POST /api/vision`
- `GET/POST /api/fabric`
- `GET/POST /api/tryon`
- `GET /api/tryon-status?id=...`
- `GET/DELETE /api/library`
- `GET/DELETE /api/chat-history`
- `GET /api/weather?lat=...&lon=...`
- `GET/PUT /api/admin` (project admin only; usage overview, report resolution/dismissal and audit trail)
- `POST /api/report` (signed-in user submits a report for an owned saved creation)

## Privacy and limitations

- Uploads are private to the signed-in user and stored under a user-scoped storage key.
- The FASHN provider receives the person and garment image data for virtual try-on. Only upload a photo of yourself or a person who has explicitly consented. Review FASHN's current data-retention terms before using real customer photos.
- Outfit generation must not invent wardrobe pieces. When selected items are returned, the UI displays the actual uploaded wardrobe images.
- Weather is retrieved from Open-Meteo only after the user chooses to share browser location. No weather conditions are fabricated.
- The current admin page is a project-admin overview. User suspension, detailed moderation workflows, CMS editing, and a full in-app role-management UI are not implemented in this first deployed iteration.
- The application currently does not use Supabase, Next.js App Router, React, TypeScript or Tailwind. Those were in the original requested stack, but the ChatGPT-hosted build runtime supplies a different supported hosting/database/auth model. The deployed source is plain HTML/CSS/JS plus server-side JS APIs.

## Testing performed

- Database migrations deployed successfully.
- Project deploy validator: no blocking errors; private-table row-access warnings cleared.
- `GET /api/wardrobe`, `/api/profile`, `/api/library`, `/api/fabric`, `/api/tryon` returned HTTP 200 for a test app user.
- Anonymous access to `/api/wardrobe` returned HTTP 401.
- App-user access to `/api/admin` returned HTTP 403; project-admin access returned HTTP 200.
- Landing page browser check returned the expected page title and hero heading; Three.js canvas was present; no page JavaScript errors were detected in that check.
- AI provider test returned the expected setup error because no Anthropic key has been configured yet. Actual generation has not been verified until a provider key is added.
- FASHN try-on generation has not been verified until the FASHN API key and credits are configured.