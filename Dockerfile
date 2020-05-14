FROM node:14-alpine

RUN mkdir /app && chown -R node:node /app

WORKDIR /app

USER node

COPY --chown=node:node package.json yarn.lock ./
COPY yarn.lock .

RUN yarn install

COPY --chown=node:node . .

EXPOSE 3000

CMD yarn start
