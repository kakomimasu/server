FROM denoland/deno:alpine-1.17.1

# EXPOSEはHerokuではサポートされていないが、ローカル用に残しておく。
EXPOSE $PORT

RUN apk add --no-cache curl

WORKDIR /home/kkmm-server
COPY . .

RUN deno cache --no-check=remote server.ts

CMD deno run -A --no-check=remote server.ts