import { runDay } from "../aoc.ts";

type Node = {
  value: number;
  delta: number;
  originalPosition: number;
  prev: Node;
  next: Node;
};

export function partOne(input: string[]): number | string {
  const { rootNode, values } = parseInput(input);
  mix(rootNode, values);

  return sumCoordinates(rootNode, values);
}

export function partTwo(input: string[]): number | string {
  const DECRYPTION_KEY = 811589153;
  const ITERATIONS = 10;
  const { rootNode, values } = parseInput(input, (x) => x * DECRYPTION_KEY);

  for (let i = 0; i < ITERATIONS; i++) {
    mix(rootNode, values);
  }

  return sumCoordinates(rootNode, values);
}

function mix(rootNode: Node, values: number[]) {
  values.forEach((_, pos) => {
    const node = findNodeWithOriginalPosition(rootNode, pos, values.length);
    if (!node) {
      throw new Error(`No node found with originalPosition ${pos}`);
    }

    if (node.delta === 0) {
      return;
    }

    // remove node from its old position
    const oldPrev = node.prev;
    const oldNext = node.next;
    oldPrev.next = oldNext;
    oldNext.prev = oldPrev;

    let newNext: Node;
    let newPrev: Node;

    if (node.delta < 0) {
      // we're going to move backward and insert _before_ the node at that place
      newNext = offset(node, node.delta);
      newPrev = newNext.prev;
    } else {
      // we're going to move forward and insert _after_ the node at that place
      newPrev = offset(node, node.delta);
      newNext = newPrev.next;
    }

    node.prev = newPrev;
    node.next = newNext;
    newNext.prev = node;
    newPrev.next = node;
  });
}

function sumCoordinates(rootNode: Node, values: number[]): number {
  let zeroNode: Node;
  for (let n = rootNode; n; n = n.next) {
    if (n.value === 0) {
      zeroNode = n;
      break;
    }
  }

  return [1000, 2000, 3000].reduce(
    function (result, offset) {
      // find the node <offset> after the zero node
      offset = offset % values.length;
      let n = zeroNode;
      for (let i = 0; i < offset; i++) {
        n = n.next;
      }
      return result + n.value;
    },
    0,
  );
}

function parseInput(
  input: string[],
  transform?: (x: number) => number,
): { rootNode: Node; values: number[] } {
  type InProgressNode = {
    value: number;
    originalPosition: number;
    prev?: InProgressNode;
    next?: InProgressNode;
  };

  let values = input.map((line) => parseInt(line, 10));

  if (transform) {
    values = values.map((value) => transform(value));
  }

  const nodes: InProgressNode[] = values.map((value, originalPosition, ar) => ({
    value,
    originalPosition,
    delta: value % (ar.length - 1),
  }));

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].prev = nodes[i - 1];
    nodes[i].next = nodes[i + 1];
  }

  nodes[0].prev = nodes[nodes.length - 1];
  nodes[nodes.length - 1].next = nodes[0];

  return { rootNode: nodes[0] as Node, values };
}

function findNodeWithOriginalPosition(
  rootNode: Node,
  pos: number,
  maxNodes?: number,
): Node | undefined {
  let count = 0;
  for (let n = rootNode; n; n = n.next) {
    count++;
    if (maxNodes != null && count > maxNodes) {
      return;
    }

    if (n.originalPosition === pos) {
      return n;
    }
  }
}

function offset(node: Node, distance: number): Node {
  for (let i = 0; i < Math.abs(distance); i++) {
    if (distance > 0) {
      node = node.next;
    } else if (distance < 0) {
      node = node.prev;
    }
  }

  return node;
}

if (import.meta.main) {
  runDay(import.meta);
}
