# Together API

**Together API** is the backend service for the Together community development platform. It powers event discovery, event creation, joining, and owner-only event management with secure JWT authentication.

**Live API:** https://together-api.example.com _(replace with the deployed URL once the server is live)_

## Features

- **RESTful event API** — Public endpoints to list upcoming events, fetch recent events, and retrieve a single event by ID.
- **Create events** — Authenticated users can publish events with a title, description, type, image URL, location, and future date/time.
- **Join events** — Authenticated users can join upcoming events; duplicate joins are blocked by a unique database index.
- **Personal event lists** — Endpoints return the events a user joined and the events a user created.
- **Owner-only updates and deletes** — `PATCH` and `DELETE` verify that the authenticated user's ID matches the event's `creatorId` before making changes.
- **JWT authentication** — Bearer tokens are verified against the auth provider's JWKS, with identity taken from the verified token payload.
- **Validation and error handling** — Request bodies are validated with Zod, and errors are returned through a centralized handler.
- **Health check** — A `/api/health` endpoint pings MongoDB and reports database connectivity.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5
- **Database:** MongoDB (official driver)
- **Validation:** Zod
- **Auth:** JOSE (JWT/JWKS verification)
- **Utilities:** CORS, dotenv, nodemon (development)

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The API runs at [http://localhost:5000](http://localhost:5000) by default.

Create a `.env` file from `.env.example` and fill in your values:

```bash
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/
DB_NAME=social_development_db

CLIENT_URL=http://localhost:3000

AUTH_BASE_URL=http://localhost:3000
AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
```

## API Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | API status |
| GET | `/api/health` | Public | Database health check |
| GET | `/api/events` | Public | List all upcoming events |
| GET | `/api/events/recent` | Public | List the six nearest upcoming events |
| GET | `/api/events/:id` | Public | Get a single event |
| GET | `/api/events/mine` | Protected | Get events created by the current user |
| POST | `/api/events` | Protected | Create a new event |
| PATCH | `/api/events/:id` | Owner | Update an event |
| DELETE | `/api/events/:id` | Owner | Delete an event and its join records |
| GET | `/api/joins/my-events` | Protected | Get events joined by the current user |
| POST | `/api/joins` | Protected | Join an upcoming event |
