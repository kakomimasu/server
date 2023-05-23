FROM denoland/deno:alpine-1.33.0

EXPOSE $PORT

WORKDIR /home/kkmm-server
COPY . .

RUN deno task cache

CMD deno task start