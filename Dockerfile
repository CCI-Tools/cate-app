FROM node:12.5.0-alpine as build

WORKDIR /usr/src/app
COPY package.json yarn.lock  ./
RUN yarn install
# nodes_modules is excluded in .dockerignore
COPY . ./
RUN yarn build


FROM nginx:stable-alpine

LABEL maintainer="helge.dzierzon@brockmann-consult.de"
LABEL name="Cate App"

COPY --from=build /usr/src/app/build /usr/share/nginx/html
# Once further nginx configuration needed, do this:
# COPY nginx.conf /usr/share/nginx/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
