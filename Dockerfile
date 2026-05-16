# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Accept API URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Yandex Maps API key (referer-restricted на parktrack.live + localhost)
ARG VITE_YMAP_KEY
ENV VITE_YMAP_KEY=$VITE_YMAP_KEY

# API mode: 'mock' включает MSW worker в prod-build для demo/staging без реального api-server.
# Для real-API integration пробросить 'real'.
ARG VITE_API_MODE=mock
ENV VITE_API_MODE=$VITE_API_MODE

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Вне conf.d/ — иначе nginx авто-include'ит как server-конфиг и падает на старте
# (bare add_header вне server{}). Подключается явным include из default.conf.
COPY nginx-security-headers.conf /etc/nginx/security-headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
