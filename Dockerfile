FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm test

FROM nginxinc/nginx-unprivileged:1.29-alpine
ARG SOURCE_REF=local
LABEL org.opencontainers.image.source="https://github.com/netraular/inferencia-estadistica-uoc" \
      org.opencontainers.image.version="${SOURCE_REF}"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html/inferencia
USER 101:101
EXPOSE 8080