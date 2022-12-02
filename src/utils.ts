export function getInputLines(
  input?: string | Buffer | NodeJS.ReadStream | undefined
): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    if (input instanceof Buffer) {
      input = input.toString("utf-8");
    }

    if (typeof input === "string") {
      input = input.trim();
      if (input.length === 0) {
        resolve([]);
        return;
      }

      resolve(input.split("\n"));
      return;
    }

    const stream: NodeJS.ReadStream = input ?? process.stdin;
    let buffer = Buffer.from("");
    stream.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });
    stream.on("end", () => {
      getInputLines(buffer).then(resolve, reject);
    });
    stream.on("error", reject);
  });
}
