FROM node:16-bullseye-slim AS dependencies

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  autoconf \
  automake \
  build-essential \
  ca-certificates \
  curl \
  ffmpeg \
  libtool \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && ln /usr/bin/python3 /usr/bin/python \
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
