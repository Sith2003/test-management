FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN node_modules/.bin/prisma generate && node_modules/.bin/tsc -p tsconfig.json

EXPOSE 3001

CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate --accept-data-loss && node -r tsconfig-paths/register dist/main.js"]
