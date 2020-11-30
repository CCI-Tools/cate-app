FROM node:stretch-slim as build-deps

LABEL maintainer="helge.dzierzon@brockmann-consult.de"
LABEL name="Cate App"
LABEL version="2.2.2-dev.1"

RUN apt-get -y update && apt-get install -y git apt-utils wget vim

ADD . /usr/src/app
WORKDIR /usr/src/app

ADD .env.production /usr/src/app

RUN yarn install --network-concurrency 1 --network-timeout 1000000

RUN yarn build
RUN yarn global add serve

CMD ["bash", "-c", "serve -l 80 -d -s build"]
