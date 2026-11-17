# Production Dockerfile for Kontrol Frontend (React + Vite + Nginx)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# مرحلة التقديم عبر Nginx الفائق السرعة
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# إعداد توجيه SPA لدعم React Router
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
