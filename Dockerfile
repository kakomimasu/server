FROM denoland/deno:alpine-1.26.1

EXPOSE $PORT

WORKDIR /home/kkmm-server
COPY . .

RUN deno task cache

CMD deno task start