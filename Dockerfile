FROM denoland/deno:alpine-2.0.2

EXPOSE $PORT

WORKDIR /home/kkmm-server
COPY . .

RUN deno task cache

CMD deno task start