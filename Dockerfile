FROM node:20

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /server.js

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 7878

CMD ["node", "server.js"]
