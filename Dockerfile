FROM denoland/deno:alpine-1.20.3

# EXPOSEはHerokuではサポートされていないが、ローカル用に残しておく。
EXPOSE $PORT

RUN apk add --no-cache curl

WORKDIR /home/kkmm-server
COPY . .

RUN deno task cache

CMD deno task start