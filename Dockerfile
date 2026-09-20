# WLT — World Leaders Tracker
# Production image: Node 22 + Nitro node-server on port 8080.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
ENV VITE_AUTH_ENABLED=false
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=8080
ENV NITRO_PORT=8080
ENV NITRO_PRESET=node-server
ENV VITE_AUTH_ENABLED=false
RUN groupadd --system wlt && useradd --system --gid wlt --home-dir /app --no-create-home wlt
COPY --from=build --chown=wlt:wlt /app/.output ./.output
COPY --from=build --chown=wlt:wlt /app/package.json ./
USER wlt
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
