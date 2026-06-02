FROM node:20-alpine

# Prisma needs OpenSSL on Alpine (avoids libssl detection warnings)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Schema must be in git at prisma/schema.prisma — copied before npm install (postinstall runs generate)
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN npm install --omit=dev

COPY . .

RUN test -f prisma/schema.prisma || (echo "FATAL: prisma/schema.prisma missing — commit it to GitHub" && exit 1)

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && exec node src/server.js"]
