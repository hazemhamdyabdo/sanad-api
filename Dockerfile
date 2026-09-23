FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000

# The dev override replaces this with hot reload + migrations. This is the
# shape a future production image would keep: build once, run the compiled
# output, no source mount.
CMD ["node", "dist/main.js"]
