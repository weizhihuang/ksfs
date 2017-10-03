# docker build -t koa-storage .
# docker run -it --rm -p 3000:3000 --name koa-storage koa-storage
FROM node:8
ADD . /app
WORKDIR /app
RUN npm install
EXPOSE 3000
CMD npm start
