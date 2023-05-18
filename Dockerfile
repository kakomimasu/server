FROM denoland/deno:alpine-1.33.3

EXPOSE $PORT

WORKDIR /home/kkmm-server
COPY . .

RUN deno task cache

CMD deno task start