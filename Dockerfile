FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm run build

EXPOSE 3000

# Keep dev dependencies: the shared CLI data source imports dotenv.
ENV NODE_ENV=production

# Migrations run inside the container at every start, right before the API boots. This does not
# depend on Railway honouring a pre-deploy command: if the schema is behind, the app cannot start
# without fixing it first. `&&` makes a failed migration exit non-zero (Railway restarts and the
# SQL error is the first thing in the deploy log) instead of booting against a stale schema.
# `exec` hands PID 1 to node so SIGTERM reaches the app on redeploy.
# railway.json's startCommand must stay identical to this line.
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js && exec node dist/main.js"]
