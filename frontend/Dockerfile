FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

CMD ["sh", "-c", "npm run dev -- -p ${PORT:-3000}"]
