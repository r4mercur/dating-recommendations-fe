# dating-recommendations-fe

Vue 3 frontend (Pinia, PrimeVue, Vite) for the dating-recommendations user service.
The roadmap for backend and frontend lives in [docs/ROADMAP.md](docs/ROADMAP.md).

## Setup

Requires Node `^20.19.0 || >=22.12.0` and the running backend (`dating-recommendation-user-service`):

```sh
./gradlew bootRun --args='--spring.profiles.active=dev'
```

The `dev` profile starts Postgres, Kafka, Solr and MinIO via `compose.yaml` and enables CORS for `http://localhost:5173`.

```sh
npm install
npm run dev
```

## Backend connection

The app only uses relative paths (`/api/...`, later `/ws`). The Vite dev server proxies them to the backend
(default `http://localhost:8080`). To use another backend, copy `.env.example` to `.env.local` and set
`API_PROXY_TARGET`.

All requests go through `apiFetch` in `src/api.js`, which adds the bearer token and turns problem responses into errors.

## Build

```sh
npm run build
```

The build expects the backend under the same origin (reverse proxy for `/api` and `/ws`).
