import { runDay } from "../aoc.ts";

type Node = {
  value: number;
  originalPosition: number;
  prev: Node;
  next: Node;
};

export function partOne(input: string[]): number | string {
  const { node, values } = parseInput(input);
  mix(node, values, console.error.bind(console));

  let zeroNode: Node;
  for (let n = node; n; n = n.next) {
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

export function partTwo(input: string[]): number | string {
  return "";
}

function mix(rootNode: Node, values: number[], log?: (...args: any[]) => void) {
  values.forEach((value, pos) => {
    if (value === 0) {
      return;
    }

    const node = findNodeWithOriginalPosition(pos);

    // remove node from its old position
    const oldPrev = node.prev;
    const oldNext = node.next;
    oldPrev.next = oldNext;
    oldNext.prev = oldPrev;

    let newNext: Node;
    let newPrev: Node;

    if (value < 0) {
      // we're going to move backward and insert _before_ the node at that place
      // [ 1, 2, -2]
      newNext = offset(node, value);
      newPrev = newNext.prev;
    } else {
      // we're going to move forward and insert _after_ the node at that place
      newPrev = offset(node, value);
      newNext = newPrev.next;
    }

    node.prev = newPrev;
    node.next = newNext;
    newNext.prev = node;
    newPrev.next = node;
  });

  function findNodeWithOriginalPosition(pos: number): Node {
    for (let n = rootNode; n; n = n.next) {
      if (n.originalPosition === pos) {
        return n;
      }
    }
    throw new Error();
  }

  function offset(node: Node, distance: number): Node {
    for (let i = 0; i < Math.abs(distance); i++) {
      if (distance > 0) {
        node = node.next;
      } else {
        node = node.prev;
      }
    }

    return node;
  }
}

function parseInput(input: string[]): { node: Node; values: number[] } {
  type InProgressNode = {
    value: number;
    originalPosition: number;
    prev?: InProgressNode;
    next?: InProgressNode;
  };

  const values = input.map((line) => parseInt(line, 10));

  const nodes: InProgressNode[] = values.map((value, originalPosition) => ({
    value,
    originalPosition,
  }));

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].prev = nodes[i - 1];
    nodes[i].next = nodes[i + 1];
  }

  nodes[0].prev = nodes[nodes.length - 1];
  nodes[nodes.length - 1].next = nodes[0];

  return { node: nodes[0] as Node, values };
}

if (import.meta.main) {
  runDay(import.meta);
}
