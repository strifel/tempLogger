FROM node
RUN mkdir /templogger
WORKDIR /templogger
COPY / ./
RUN npm install
ENTRYPOINT npm run start
