# Stage 1: Builder
# Vite 8 requires Node 20.19+/22.12+ (node:18 lacks the CustomEvent global it needs).
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-timeout 600000 && \
    npm ci

COPY . .

ARG VITE_API_URL=http://api.pkl.local/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Production (nginx static serving)
FROM nginx:1.25-alpine

LABEL maintainer="PKL Apps Team"
LABEL component="Frontend Admin"

COPY .docker/admin-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
