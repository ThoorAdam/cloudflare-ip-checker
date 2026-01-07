FROM oven/bun:latest

COPY . .

CMD ["bun", "run", "index.ts"]
