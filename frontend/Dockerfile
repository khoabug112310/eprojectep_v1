# CineBook Frontend Dockerfile
# Multi-stage build for optimal production image

# Stage 1: Build the application
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_BASE_URL
ARG VITE_ENVIRONMENT=production
ARG VITE_APP_VERSION
ARG VITE_ERROR_TRACKING_ENABLED=true
ARG VITE_WEBSOCKET_URL
ARG VITE_PAYMENT_GATEWAY_URL

# Set environment variables
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ERROR_TRACKING_ENABLED=$VITE_ERROR_TRACKING_ENABLED
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_PAYMENT_GATEWAY_URL=$VITE_PAYMENT_GATEWAY_URL

# Build the application
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    tzdata

# Set timezone
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]