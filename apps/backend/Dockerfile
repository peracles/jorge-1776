FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm approve-builds esbuild && pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
