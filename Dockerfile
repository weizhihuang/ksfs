FROM node
ADD . /app
WORKDIR /app
RUN yarn
EXPOSE 3000
CMD npm start