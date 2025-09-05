FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
 COPY tsconfig.json ./
 COPY src ./src
 COPY scripts ./scripts
 COPY doc ./doc

COPY package*.json ./
ENV NPM_CONFIG_PRODUCTION=false
RUN npm install

COPY --from=builder /app/dist ./dist

RUN chmod +x ./scripts/create-root.sh \
    && npm install -g ts-node typescript tsconfig-paths
ENV PORT=5001
ENTRYPOINT ["./scripts/create-root.sh"]

EXPOSE 5001
CMD ["npm", "start"]