# syntax=docker/dockerfile:1.7
# PZSM: Project Zomboid (Build 42) dedicated server + manager web panel in one image.

ARG NODE_VERSION=22

# ---------------------------------------------------------------- build
FROM node:${NODE_VERSION}-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /src
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/pz-formats/package.json packages/pz-formats/
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY packages packages
COPY apps apps
RUN pnpm --filter @pzsm/pz-formats build \
 && pnpm --filter @pzsm/shared build \
 && pnpm --filter @pzsm/server build \
 && pnpm --filter @pzsm/web build
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm --filter @pzsm/server deploy --prod /out \
 && cp -r apps/web/dist /out/web

# ---------------------------------------------------------------- runtime
FROM debian:bookworm-slim
ARG NODE_VERSION
ENV DEBIAN_FRONTEND=noninteractive
RUN dpkg --add-architecture i386 \
 && apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl tini gosu procps lib32gcc-s1 lib32stdc++6 libsdl2-2.0-0:i386 locales \
 && sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen \
 && rm -rf /var/lib/apt/lists/*
ENV LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

COPY --from=build /usr/local/bin/node /usr/local/bin/node

# SteamCMD (self-updates on first run; bootstrapped here to speed up first start)
RUN mkdir -p /opt/steamcmd \
 && curl -fsSL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar -xz -C /opt/steamcmd \
 && useradd -m -u 1000 -s /bin/bash pzsm \
 && chown -R pzsm:pzsm /opt/steamcmd \
 && su pzsm -c "/opt/steamcmd/steamcmd.sh +quit" || true

COPY --from=build /out /app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data && chown pzsm:pzsm /data

ENV PZSM_DATA=/data \
    PZSM_WEB_DIR=/app/web \
    STEAMCMD=/opt/steamcmd/steamcmd.sh \
    PORT=8080 \
    HOST=0.0.0.0 \
    NODE_ENV=production

VOLUME ["/data"]
EXPOSE 8080/tcp 16261/udp 16262/udp
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD curl -fsS http://127.0.0.1:${PORT}/healthz || exit 1
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
CMD ["node", "/app/dist/index.js"]
