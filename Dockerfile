FROM denoland/deno:alpine-1.40.2

EXPOSE $PORT

WORKDIR /home/kkmm-server
COPY . .

RUN deno task cache

CMD deno task start