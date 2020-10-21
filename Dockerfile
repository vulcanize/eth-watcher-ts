FROM node:10.15.2-alpine

# Create app directory
WORKDIR /app

RUN apk add --no-cache \
    make g++ git ca-certificates

RUN npm install -g typescript ts-node

COPY package*.json ./

RUN npm install

COPY . .

RUN npm config set unsafe-perm true && npm run build

EXPOSE 3000

ENV NODE_ENV production

#CMD ["node", "./dist/server.js"]
