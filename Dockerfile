FROM denoland/deno:alpine-2.7.4

EXPOSE $PORT

WORKDIR /home/kkmm-server
COPY . .

RUN deno task prisma:generate

RUN deno task cache

CMD deno task start