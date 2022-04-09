FROM node:16-bullseye-slim AS dependencies

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  curl \
  ffmpeg \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && ln /usr/bin/python3 /usr/bin/python \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && yarn global add node-gyp

WORKDIR /app
COPY ./tsconfig.json ./package.json ./yarn.lock ./

FROM dependencies AS debug
RUN yarn install
CMD yarn debug

FROM dependencies AS runtime
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile --production
COPY ./src ./src
RUN yarn compile
CMD node dist/index.js
