FROM node:24-slim AS app

WORKDIR /app

ENV HOST=0.0.0.0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "node scripts/with-app-env.mjs vite preview --host 0.0.0.0 --port ${PORT:-8080}"]
