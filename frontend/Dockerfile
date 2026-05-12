FROM node:18-alpine as build

WORKDIR /app

COPY . .

RUN npm install || true

# no build needed (static HTML project)

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]