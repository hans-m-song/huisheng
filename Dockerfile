FROM node:22-alpine

RUN --mount=type=cache,target=/etc/apk/cache \
  apk add --update-cache --no-interactive \
  bzip2 \
  ca-certificates \
  curl \
  ffmpeg \
  fontconfig \
  g++ \
  make \
  openssl \
  python3 \
  tar

# curl --tlsv1

# phantomjs
RUN set -x  \
  && mkdir /tmp/phantomjs \
  && curl -L https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
  | tar -xjf - --strip-components=1 -C /tmp/phantomjs \
  && mv /tmp/phantomjs/bin/phantomjs /usr/local/bin \
  && rm -rf /tmp/phantomjs

# yt-dlp
RUN set -x  \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

# yt-dlp-pot-provider plugin
RUN set -x  \
  && mkdir -p /home/node/.config/yt-dlp/plugins/pot_provider \
  && curl -L https://github.com/Brainicism/bgutil-ytdlp-pot-provider/releases/latest/download/bgutil-ytdlp-pot-provider.zip -o /tmp/bgutil-ytdlp-pot-provider.zip \
  && unzip /tmp/bgutil-ytdlp-pot-provider.zip -d /home/node/.config/yt-dlp/plugins/pot_provider \
  && rm /tmp/bgutil-ytdlp-pot-provider.zip

USER node
WORKDIR /app
COPY --chown=node ./tsconfig.json ./package.json ./package-lock.json ./
COPY --chown=node ./src ./src
RUN set -x \
  && npm install \
  && npm run compile \
  && rm -rf ./src
ARG GITHUB_SHA=unknown
ENV GITHUB_SHA=${GITHUB_SHA}
CMD ["node", "dist/index.js"]
