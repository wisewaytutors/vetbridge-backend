FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma

# --ignore-scripts: postinstall needs scripts/ which is not copied until later
RUN npm install --omit=dev --ignore-scripts

COPY . .

RUN test -f prisma/schema.prisma || (echo "FATAL: prisma/schema.prisma missing" && exit 1)

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && exec node src/server.js"]
