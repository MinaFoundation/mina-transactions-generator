FROM node:alpine as build

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./
COPY src ./src

RUN npm install && npm run build

FROM node:alpine

WORKDIR /app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./
COPY --from=build /usr/src/app/package*.json ./

CMD ["node", "./entry.js"]
