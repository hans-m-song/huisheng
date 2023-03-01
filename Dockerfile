FROM node:16-bullseye-slim

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  curl \
  ffmpeg \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && ln /usr/bin/python3 /usr/bin/python \
  && yarn global add node-gyp

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY ./tsconfig.json ./package.json ./yarn.lock ./

RUN yarn install
COPY ./src ./src
RUN yarn compile
ARG GITHUB_SHA=unknown
ENV GITHUB_SHA=${GITHUB_SHA}
CMD node dist/index.js
