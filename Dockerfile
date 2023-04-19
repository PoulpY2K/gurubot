## build runner
FROM --platform=linux/amd64 node:19-alpine as build-runner

# Set temp directory
WORKDIR /tmp/app

# Move package.json
COPY package.json .

# Move prisma
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Move source files
COPY src ./src
COPY tsconfig.json .

# Run prisma client
RUN npx prisma generate

# Build project
RUN npm run build

## production runner
FROM --platform=linux/amd64 node:19-alpine as prod-runner

# Set work directory
WORKDIR /app

# Copy package.json from build-runner
COPY --from=build-runner /tmp/app/package.json /app/package.json

# Copy prisma from build-runner
COPY --from=build-runner /tmp/app/prisma/ /app/prisma/

# Install dependencies
RUN npm install --omit=dev

# Move build files
COPY --from=build-runner /tmp/app/build /app/build

# Migrate database and start bot
CMD ["npm", "run", "start", "&&", "npx", "prisma", "migrate", "dev"]