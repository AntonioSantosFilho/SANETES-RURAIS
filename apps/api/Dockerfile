FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @sanetes/api --include-workspace-root

FROM dependencies AS build
COPY apps/api apps/api
COPY drizzle drizzle
RUN npm run build --workspace @sanetes/api

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @sanetes/api --include-workspace-root --omit=dev
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/drizzle drizzle
CMD ["sh", "-c", "node apps/api/dist/migrate.js && node apps/api/dist/seed.js && npm run start --workspace @sanetes/api"]
