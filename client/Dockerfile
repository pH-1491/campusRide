FROM node:20-alpine AS builder

ARG VITE_SERVER_URL=http://localhost:5000
ENV VITE_SERVER_URL=$VITE_SERVER_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
