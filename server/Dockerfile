# Deploy with: docker build -t jewellery-api . && docker run -p 5000:5000 --env-file .env jewellery-api
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 5000

ENV NODE_ENV=production
CMD ["node", "src/index.js"]
