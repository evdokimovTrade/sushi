# ТаланД: Next.js + Prisma + SQLite, один контейнер.
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY . .
# Номера счётчиков вшиваются в сайт при сборке.
ARG NEXT_PUBLIC_YM_ID=""
ARG NEXT_PUBLIC_VK_PIXEL_ID=""
ARG NEXT_PUBLIC_GA4_ID=""
ENV NEXT_PUBLIC_YM_ID=$NEXT_PUBLIC_YM_ID NEXT_PUBLIC_VK_PIXEL_ID=$NEXT_PUBLIC_VK_PIXEL_ID NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID
RUN rm -f .env && npm run build
ENV NODE_ENV=production
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "docker/entrypoint.sh"]
