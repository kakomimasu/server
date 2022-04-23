const sleep = (msec: number) =>
  new Promise((resolve) => setTimeout(resolve, msec));

while (true) {
  try {
    await Deno.connectTls({ port: 9099, hostname: "localhost" });
    break;
  } catch (_e) {
    console.log(".");
    await sleep(1000);
  }
}
