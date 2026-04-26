# Turf Booking Platform — Backend Microservices

This repository contains the backend services for the Turf Booking Platform, organized as independent microservices.

## Architecture

```
├── api-gateway/       → Routes requests to microservices (port 5000)
├── auth-service/      → User auth, registration, OAuth (port 5001)
├── turf-service/      → Turf CRUD operations (port 5002)
├── booking-service/   → Booking management + Redis locking (port 5003)
├── seed.js            → Database seed script
├── Jenkinsfile        → CI/CD with per-service change detection
└── README.md
```

## Microservices

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 5000 | Reverse proxy routing to backend services |
| Auth Service | 5001 | User registration, login, JWT, Google OAuth |
| Turf Service | 5002 | Turf CRUD (owner dashboard) |
| Booking Service | 5003 | Booking creation, cancellation, Redis-based locking |

## CI/CD — Change Detection

The `Jenkinsfile` uses `git diff` to detect which service directories have changed. **Only the modified microservice(s)** go through the install → test → build → push pipeline. Unchanged services are skipped entirely.

## Running Locally

Each service can be run independently:

```bash
cd auth-service && npm install && npm run dev
cd turf-service && npm install && npm run dev
cd booking-service && npm install && npm run dev
cd api-gateway && npm install && npm run dev
```

Or use the docker-compose from the Infra repo to run everything together.

## Seeding the Database

```bash
MONGO_URI=mongodb://localhost:27017/turf_booking node seed.js
```
