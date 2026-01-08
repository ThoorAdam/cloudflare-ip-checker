FROM docker.io/oven/bun:latest

COPY . .

CMD ["bun", "run", "index.ts"]
