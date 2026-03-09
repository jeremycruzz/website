# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Optional: pass API URLs at build time
# docker build --build-arg VITE_API_URL=https://api.example.com --build-arg VITE_SEPARATE_API_URL=https://separate.example.com .
ARG VITE_API_URL
ARG VITE_SEPARATE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SEPARATE_API_URL=$VITE_SEPARATE_API_URL

RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
