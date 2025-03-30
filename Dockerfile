FROM node:22-bullseye-slim

RUN set -x \
  && apt-get update --quiet \
  && DEBIAN_FRONTEND=noninteractive apt-get install --quiet --yes --no-install-recommends \
  build-essential \
  bzip2 \
  ca-certificates \
  curl \
  ffmpeg \
  libfontconfig \
  python3 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && ln /usr/bin/python3 /usr/bin/python

# phantomjs
ENV OPENSSL_CONF=/opt/openssl.cnf
RUN set -x  \
  && mkdir /tmp/phantomjs \
  && curl -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
  | tar -xj --strip-components=1 -C /tmp/phantomjs \
  && mv /tmp/phantomjs/bin/phantomjs /usr/local/bin \
  && touch ${OPENSSL_CONF}

# yt-dlp
RUN set -x  \
  && curl -sSfL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY ./tsconfig.json ./package.json ./package-lock.json ./
RUN npm install
COPY ./src ./src
RUN npm run compile
ARG GITHUB_SHA=unknown
ENV GITHUB_SHA=${GITHUB_SHA}
CMD ["node", "dist/index.js"]
