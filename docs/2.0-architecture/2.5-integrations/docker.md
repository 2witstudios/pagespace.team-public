# Integration: Docker

This document outlines how pagespace uses Docker and Docker Compose to create a consistent, one-command local development environment.

## Overview

We use Docker to containerize each part of our application stack. The entire local environment is orchestrated by the [`docker-compose.yml`](docker-compose.yml:1) file at the root of the project. This approach ensures that every developer has the exact same setup, regardless of their host operating system, which eliminates "it works on my machine" problems.

The primary command to get started is `docker-compose up`.

## Service Architecture

Our `docker-compose.yml` defines four key services:

### 1. `postgres`

-   **Purpose:** Runs our PostgreSQL database.
-   **Image:** Uses the official `postgres:17.5-alpine` image.
-   **Persistence:** Database files are persisted to a Docker volume named `postgres_data` to ensure data is not lost when the container is stopped or restarted.
-   **Healthcheck:** Includes a healthcheck to ensure that other services don't start until the database is fully ready to accept connections.

### 2. `migrate`

-   **Purpose:** A short-lived utility container that runs database migrations.
-   **Dockerfile:** [`apps/web/Dockerfile.migrate`](apps/web/Dockerfile.migrate:1)
-   **Startup Order:** This service runs *before* the `web` and `realtime` services, thanks to the `depends_on` configuration with `condition: service_completed_successfully`.
-   **Command:** It executes `pnpm run db:migrate` and then exits. This ensures our database schema is always up-to-date before the applications attempt to connect to it.

### 3. `web`

-   **Purpose:** The main Next.js frontend and backend application.
-   **Dockerfile:** [`apps/web/Dockerfile`](apps/web/Dockerfile:1)
-   **Build Strategy:** This is a multi-stage Dockerfile that is optimized for build speed and a small final image size.
    -   `deps` stage: Installs all `pnpm` dependencies. This layer is only rebuilt if the lockfile changes.
    -   `builder` stage: Copies the dependencies and source code, then runs `pnpm build` to build the Next.js application.
    -   `runner` stage: A minimal production image that copies only the necessary standalone build artifacts from the `builder` stage.
-   **Dependencies:** It waits for the `migrate` service to complete successfully before starting.

### 4. `realtime`

-   **Purpose:** The standalone Socket.IO server for real-time communication.
-   **Dockerfile:** [`apps/realtime/Dockerfile`](apps/realtime/Dockerfile:1)
-   **Build Strategy:** This is a simpler multi-stage build that installs dependencies and then copies the source code into a production image.
-   **Execution:** It uses `tsx` to run the TypeScript source code (`apps/realtime/src/index.ts`) directly, without a separate build step for the server itself.
-   **Dependencies:** It also waits for the `migrate` service to complete.

## How to Use

### Starting the Environment

To build and start all services, run the following command from the root of the project:

```bash
docker-compose up
```

To force a rebuild of the container images if you've made changes to a `Dockerfile`:

```bash
docker-compose up --build
```

### Stopping the Environment

To stop and remove all the containers, run:

```bash
docker-compose down
```

## Environment Variables

For Dockerized environments, most necessary environment variables for inter-service communication (like `DATABASE_URL` and `NEXT_PUBLIC_REALTIME_URL`) are defined directly within the [`docker-compose.yml`](docker-compose.yml:1) file. This ensures that the containers can connect to each other using their service names (e.g., `postgres:5432`).

-   `DATABASE_URL`: Used by `migrate`, `web`, and `realtime` services to connect to PostgreSQL.
-   `NEXT_PUBLIC_REALTIME_URL`: Used by the `web` service to connect to the `realtime` server. This is also used by the `realtime` service for `CORS_ORIGIN`.
-   `CORS_ORIGIN`: Configured in `realtime` service to allow requests from the `web` app. It references `NEXT_PUBLIC_REALTIME_URL`.

You generally do not need a local `.env` file for the Dockerized environment to function, as these variables are passed directly to the containers. However, the root `.env` file is still relevant for database migrations run outside of Docker (e.g., `pnpm db:migrate`).