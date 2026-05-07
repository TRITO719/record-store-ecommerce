FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
# Set the API URL to be used during build (can be overridden, but here we'll use relative path via API Gateway)
ENV VITE_API_URL=/api
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Add basic nginx config to handle React Router
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
