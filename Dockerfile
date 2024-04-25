# Stage 1: Build the React client app
FROM node:16 as build
WORKDIR /app
COPY client/package.json client/yarn.lock ./
RUN yarn install
COPY client/ ./
RUN yarn build

# Stage 2: Build the Node.js server app
FROM node:16
WORKDIR /app
# copy package.json and packages-lock.json to install dependencies
COPY server/ server/
RUN cd server && npm install
COPY --from=build /app/build ./client/build

EXPOSE 3000
CMD ["node", "server/server.js"]