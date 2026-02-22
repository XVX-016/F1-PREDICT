FROM node:20-alpine

WORKDIR /app

COPY Frontend/package*.json /app/
RUN npm ci

COPY Frontend /app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
