import { getInputLines } from "../utils";

type File = {
  name: string;
  size: number;
};

type Directory = {
  name: string;
  items: (File | Directory)[];
  parent: Directory | RootDirectory;
};

type RootDirectory = {
  name: "/";
  items: (File | Directory)[];
  parent?: undefined;
};

run().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});

async function run() {
  const input = await getInputLines();
  console.log(partOne(input));
  console.log(partTwo(input));
}

function partOne(input: string[]): number {
  const root = parse(input);
  let totalSize = 0;
  visitDirs(root.items, (d) => {
    const size = sizeOfDirectory(d);
    if (size <= 100000) {
      console.error(d.name, size);
      totalSize += size;
    }
  });

  return totalSize;
}

function partTwo(input: string[]): number {
  const TOTAL_DISK_SPACE = 70000000;
  const FREE_SPACE_NEEDED = 30000000;

  const root = parse(input);

  function reducer(result: Directory[], item: File | Directory): Directory[] {
    if (isFile(item)) {
      return result;
    }
    result.push(item);

    return item.items.reduce(reducer, result);
  }

  const allDirsBySize = root.items.reduce<Directory[]>(reducer, []);
  allDirsBySize.sort((x, y) => {
    const sizeOfX = sizeOfDirectory(x);
    const sizeOfY = sizeOfDirectory(y);

    if (sizeOfX < sizeOfY) {
      return -1;
    } else if (sizeOfX > sizeOfY) {
      return 1;
    }

    return 0;
  });

  const freeSpaceAvailable = TOTAL_DISK_SPACE - sizeOfDirectory(root);
  const minDirectorySizeNeeded = FREE_SPACE_NEEDED - freeSpaceAvailable;

  const dirToDelete = allDirsBySize.find((d) => {
    const size = sizeOfDirectory(d);
    if (size >= minDirectorySizeNeeded) {
      return true;
    }
  });

  if (!dirToDelete) {
    throw new Error("no dir to delete found");
  }

  return sizeOfDirectory(dirToDelete);
}

function parse(input: string[]): RootDirectory {
  const root: RootDirectory = {
    name: "/",
    items: [],
  };

  let isListing = false;
  let current: Directory | RootDirectory = root;

  input.forEach((line) => {
    if (line === "$ cd /") {
      current = root;
      isListing = false;
      return;
    }

    if (line === "$ cd ..") {
      if (!current.parent) {
        throw new Error("no parent dir");
      }
      current = current.parent;
      isListing = false;
      return;
    }

    const m = /^\$ cd (.+)$/.exec(line);
    if (m) {
      const next = current.items.find((i) => isDirectory(i) && i.name === m[1]);
      if (!next || !isDirectory(next)) {
        throw new Error(`dir not found: ${m[1]}`);
      }
      current = next;
      isListing = false;
      return;
    }

    if (line === "$ ls") {
      isListing = true;
      return;
    }

    if (!isListing) {
      throw new Error("not listing, but seems like we are?");
    }

    const [sizeAsString, name] = line.split(" ");

    if (sizeAsString === "dir") {
      const existing = current.items.find(
        (i) => isDirectory(i) && i.name === name
      );
      if (!existing) {
        current.items.push({
          parent: current,
          name,
          items: [],
        });
      }
      return;
    } else {
      const existing = current.items.find((i) => isFile(i) && i.name === name);
      if (!existing) {
        const size = parseInt(sizeAsString, 10);
        if (isNaN(size)) {
          throw new Error(`Invalid size: ${sizeAsString} ('${line}')`);
        }
        current.items.push({
          parent: current,
          name,
          size,
        });
      }
    }
  });

  return root;
}

function isDirectory(item: File | Directory): item is Directory {
  return Array.isArray((item as any).items);
}

function isFile(item: File | Directory): item is File {
  return !isDirectory(item);
}

function sizeOfDirectory(d: { items: (Directory | File)[] }): number {
  return d.items.reduce((total, item) => {
    if (isFile(item)) {
      return total + item.size;
    } else if (isDirectory(item)) {
      return total + sizeOfDirectory(item);
    }
    return total;
  }, 0);
}

function visitDirs(items: (File | Directory)[], func: (d: Directory) => void) {
  items.forEach((i) => {
    if (isDirectory(i)) {
      func(i);
      visitDirs(i.items, func);
    }
  });
}
