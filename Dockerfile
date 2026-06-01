FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# Use start script (runs migrations then server)
CMD ["sh", "start.sh"]
