import { getInputLines } from "../utils.ts";

async function run() {
  const input = await getInputLines();
  console.log(partOne(input));
  console.log(partTwo(input));
}

type Player = "rock" | "paper" | "scissors";

type Rule = {
  id: Player;
  aka: string[];
  value: number;
  beats: Player;
};

const rules: Rule[] = [
  {
    id: "rock",
    aka: ["A", "X"],
    value: 1,
    beats: "scissors",
  },
  {
    id: "paper",
    aka: ["B", "Y"],
    value: 2,
    beats: "rock",
  },
  {
    id: "scissors",
    aka: ["C", "Z"],
    value: 3,
    beats: "paper",
  },
];

function partOne(input: string[]): number {
  // What would your total score be if everything goes exactly according to your strategy guide?
  return input.reduce((totalScore, round) => {
    const [theirMove, myMove] = round.split(" ");
    const me = rules.find((r) => r.aka.includes(myMove));
    const them = rules.find((r) => r.aka.includes(theirMove));

    if (!me || !them) {
      console.error(round);
      throw new Error();
    }

    return totalScore + scoreRound(me, them);
  }, 0);
}

function partTwo(input: string[]): number {
  // what would your total score be if everything goes exactly according to your strategy guide?

  return input.reduce(function (totalScore, round) {
    const [theirMove, desiredOutcome] = round.split(" ");
    const them = rules.find((r) => r.aka.includes(theirMove));

    if (!them) {
      throw new Error();
    }

    let me: Rule | undefined;

    if (desiredOutcome === "X") {
      // i need to lose, find a move that they will beat
      me = rules.find((r) => r.id === them.beats);
    } else if (desiredOutcome === "Y") {
      // i need to draw, use their same move
      me = them;
    } else if (desiredOutcome === "Z") {
      // i need to win, find a move that beats them
      me = rules.find((r) => r.beats === them.id);
    }

    if (!me) {
      throw new Error();
    }

    return totalScore + scoreRound(me, them);
  }, 0);
}

function scoreRound(me: Rule, them: Rule): number {
  let score = me.value;

  if (me === them) {
    score += 3;
  } else if (me.beats == them.id) {
    score += 6;
  }
  return score;
}

await run();
