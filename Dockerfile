FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN apk add --no-cache openssl
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "server.js"]   # or your actual start file