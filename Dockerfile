FROM node:22-alpine

RUN set -x \
  && apk update \
  && apk add --no-cache --no-interactive \
  bzip2 \
  ca-certificates \
  curl \
  ffmpeg \
  fontconfig \
  g++ \
  make \
  python3 \
  tar

# phantomjs
ENV OPENSSL_CONF=/opt/openssl.cnf
RUN set -x  \
  && mkdir /tmp/phantomjs \
  && curl -L https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
  | tar -xjf - --strip-components=1 -C /tmp/phantomjs \
  && mv /tmp/phantomjs/bin/phantomjs /usr/local/bin \
  && rm -rf /tmp/phantomjs \
  && touch ${OPENSSL_CONF}

# yt-dlp
RUN set -x  \
  && curl -ksSfL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY ./tsconfig.json ./package.json ./package-lock.json ./
RUN npm install
COPY ./src ./src
RUN npm run compile
ARG GITHUB_SHA=unknown
ENV GITHUB_SHA=${GITHUB_SHA}
CMD ["node", "dist/index.js"]
