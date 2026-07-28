# Smart Real Estate Backend

This backend powers a property marketplace with role-based access, platform price ranges, buyer preferences, explainable rule-based recommendations, seller listings, 3D-tour requests, and admin verification.

## Before starting

You need Node.js 18 or newer, XAMPP/MySQL running, and the `smart_real_estate` database imported in phpMyAdmin.

## Run on macOS

1. Open **Terminal** with `Command + Space`, type `Terminal`, and press Enter.

2. Open the backend folder:

```bash
cd ~/Desktop/smart-real-estate-backend
```

3. Install packages (run this once, or whenever `package.json` changes):

```bash
npm install
```

4. Open phpMyAdmin and apply the new migration **once**:

```bash
open http://localhost/phpmyadmin
```

Select the `smart_real_estate` database → **Import** → choose `database/001_ai_decision_platform.sql` from this project folder → press **Import/Go**.

This adds only the following; it does not remove existing data:

- `commission_terms_accepted` on `properties`
- `property_intelligence` for AI decision-support reports
- `three_d_requests` to track the company 3D-capture workflow

5. Confirm that `.env` has your local MySQL details and a private JWT secret. If it does not exist yet, make it from the example:

```bash
cp .env.example .env
open -e .env
```

6. Check the JavaScript files before running:

```bash
npm run check
```

7. Start the backend in development mode:

```bash
npm run dev
```

When Terminal shows `Server running on http://localhost:5001`, keep that Terminal window open.

8. Open a **new** Terminal window and test the public property API:

```bash
curl http://localhost:5001/api/properties
```

## Important product rules

- A seller enters their original expected price, but public responses expose only a 5%–10% higher platform price range.
- New listings must explicitly accept the platform price-range terms.
- Seller price is visible only in seller/admin APIs, never in public listings, details, comparisons, favourites, or recommendations.
- AI reports are rule-based decision support. They include a disclaimer and must not be presented as guaranteed future price, legal verification, or flood-safety advice.

## API map

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Discovery | `GET /api/properties`, `GET /api/properties/:id`, `GET /api/properties/compare?ids=1,2` |
| Seller | `GET /api/properties/mine`, `POST /api/properties`, `PUT /api/properties/:id`, `POST /api/properties/:id/images`, `POST /api/properties/:id/3d-request` |
| Buyer AI | `GET/PUT /api/preferences`, `GET /api/recommendations` |
| Buyer actions | `GET/POST/DELETE /api/favorites/:propertyId`, `POST /api/inquiries`, `POST /api/reviews` |
| Admin | `GET /api/admin/dashboard`, pending property verification, user controls, nearby facilities, 3D workflow |

## First test: seller property request body

After logging in as a seller and copying the returned JWT token, send this body to `POST /api/properties` with the header `Authorization: Bearer <token>`:

```json
{
  "title": "2BHK near Hinjewadi Phase 2",
  "description": "Well-lit apartment for families and professionals.",
  "price": 5000000,
  "property_type": "apartment",
  "area_sqft": 920,
  "address": "Hinjewadi Phase 2",
  "city": "Pune",
  "state": "Maharashtra",
  "known_issues": "Parking is limited during evening hours.",
  "needs_3d_shoot": true,
  "commission_terms_accepted": true
}
```

The property enters `pending` status. An admin must verify it before it appears in public search.
