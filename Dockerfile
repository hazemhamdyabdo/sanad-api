FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm run build

EXPOSE 3000

# Railway runs compiled migrations in its pre-deploy container (railway.json).
# Keep dev dependencies: the shared CLI data source imports dotenv.
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
