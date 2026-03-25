FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY index.html app.js styles.css server.js boris-noiva-header.png ./
COPY data ./data

RUN mkdir -p /app/storage

ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
