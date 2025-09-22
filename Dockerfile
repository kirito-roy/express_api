# server/Dockerfile
FROM node:20-alpine

WORKDIR /app/express_api

COPY package*.json ./

# Install all deps including devDependencies
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
