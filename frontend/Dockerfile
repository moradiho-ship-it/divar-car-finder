FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# API base URL is injected at build time by Vite. Passed as a build arg from
# compose (compose.prod.yml -> frontend.build.args.VITE_API_URL) and exposed as
# an env var so `vite build` picks it up. Local .env files are excluded via
# .dockerignore so they can never override this in a production image.
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
