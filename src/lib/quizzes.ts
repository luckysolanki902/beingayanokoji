/**
 * The examination that ends each lecture.
 *
 * These are comprehension questions about the *argument*, not recall questions
 * about the text. Every wrong option is a position a reasonable person actually
 * holds, usually the popular version of the idea that the lecture spent four
 * thousand words dismantling. A reader who skimmed will pick one of those, which
 * is the entire mechanism: you cannot pass by having had the page open.
 *
 * The explanation shown after answering matters more than the score. It is the
 * last chance to make the distinction land.
 */

export interface QuizQuestion {
  /** Stable id, so an answered question survives a reworded prompt. */
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Shown once answered, right or wrong. */
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

/** How many must be right to pass. Two of three, one slip is allowed. */
export const PASS_THRESHOLD = 2;

const QUIZZES: Record<string, Quiz> = {
  "the-white-room-is-a-choice": {
    questions: [
      {
        id: "wr1",
        prompt:
          "The lecture argues you are largely the output of inputs you never selected. What does it say follows from that?",
        options: [
          "Nothing you do is really your own, so responsibility is an illusion",
          "You should reject your conditioning wholesale and start from nothing",
          "The first deliberate act available to you is choosing what is allowed to shape you from here",
          "Your early environment fixes your ceiling, so effort is better spent elsewhere",
        ],
        answer: 2,
        explanation:
          "The point is not that conditioning excuses you, nor that it can be erased. It is that the inputs going in from now on are the one part of the process you can put your hands on, so that is where deliberate action starts.",
      },
      {
        id: "wr2",
        prompt: "In what sense is the white room 'a choice'?",
        options: [
          "Anyone can construct a controlled environment if they are disciplined enough",
          "Everyone already lives in one (an environment shaping them) and the only question is whether they chose it",
          "It is a thought experiment with no bearing on ordinary life",
          "Choosing isolation is the fastest route to self-development",
        ],
        answer: 1,
        explanation:
          "The room is not somewhere you might go. It is where you already are: an environment doing its work on you continuously. The choice is between authoring it and letting it be authored for you.",
      },
      {
        id: "wr3",
        prompt:
          "Someone says: 'I'll change once I feel more motivated.' On this lecture's argument, what is wrong with that?",
        options: [
          "Motivation is a myth and only discipline exists",
          "It waits on an internal state that is itself an output of the environment they have not changed",
          "Nothing, motivation genuinely does precede change",
          "They should set more ambitious goals instead",
        ],
        answer: 1,
        explanation:
          "Feeling is downstream of inputs. Waiting to feel different inside an unchanged environment is waiting for a machine to produce an output it is not built to produce.",
      },
    ],
  },

  "the-space-between-stimulus-and-response": {
    questions: [
      {
        id: "sp1",
        prompt: "What exactly is the skill this lecture says is most valuable?",
        options: [
          "Suppressing your reaction until the moment has passed",
          "Reacting faster and more decisively than other people",
          "Widening the interval between what happens and what you do, so the response becomes a choice",
          "Never allowing yourself to feel provoked in the first place",
        ],
        answer: 2,
        explanation:
          "Not speed, and not suppression. The skill is holding observation open long enough that what follows is selected rather than triggered.",
      },
      {
        id: "sp2",
        prompt: "Why is suppression not the same thing as this gap?",
        options: [
          "Suppression is harder to sustain but achieves the same result",
          "Suppression still lets the reflex run and only hides the output; the gap changes what gets chosen",
          "Suppression is more effective in professional settings",
          "There is no meaningful difference between them",
        ],
        answer: 1,
        explanation:
          "A suppressed reaction has already happened; you are simply paying to conceal it. Widening the gap intervenes earlier, before the response is fixed.",
      },
      {
        id: "sp3",
        prompt:
          "The gap is described as trainable rather than innate. What follows practically?",
        options: [
          "It grows through repeated deliberate practice under real provocation, not through insight alone",
          "Reading about it is sufficient, since it is a matter of understanding",
          "Only people with a certain temperament can develop it",
          "It requires removing yourself from provoking situations permanently",
        ],
        answer: 0,
        explanation:
          "Understanding the gap does not widen it. It widens under load, which means the provocations you would rather avoid are the training.",
      },
    ],
  },

  "the-unreadable-man": {
    questions: [
      {
        id: "ur1",
        prompt: "How does the lecture distinguish restraint from coldness?",
        options: [
          "They are the same thing viewed from inside and outside",
          "Restraint withholds the broadcast while the feeling stays intact; coldness is the absence of the feeling",
          "Coldness is restraint practised well",
          "Restraint is for strangers, coldness is for everyone",
        ],
        answer: 1,
        explanation:
          "The unreadable man is not the man who feels nothing. He feels it and declines to transmit it, which is a decision, not a deficit.",
      },
      {
        id: "ur2",
        prompt: "Why is not broadcasting your internal state described as leverage?",
        options: [
          "Because information about you is what others use to predict and price you",
          "Because it makes people find you more interesting",
          "Because it prevents you from being manipulated emotionally",
          "Because silence is generally seen as a sign of intelligence",
        ],
        answer: 0,
        explanation:
          "Anyone who can read your state can anticipate your moves. Withholding it is not mystique; it removes the input others were using.",
      },
      {
        id: "ur3",
        prompt: "What is the failure mode the lecture warns about?",
        options: [
          "Becoming unreadable to people who have earned access, until there is no one left who knows you",
          "Being perceived as arrogant by colleagues",
          "Losing the ability to feel emotions at all",
          "Becoming so predictable that restraint stops working",
        ],
        answer: 0,
        explanation:
          "Restraint is aimed at people who have not earned access. Applied indiscriminately it stops being leverage and becomes isolation.",
      },
    ],
  },

  "the-quiet-discipline-of-reading": {
    questions: [
      {
        id: "qr1",
        prompt:
          "The lecture calls the decline of deep reading environmental rather than moral. Why does that distinction matter?",
        options: [
          "It means nobody is responsible for their own attention",
          "It means the fix is redesigning conditions rather than summoning more willpower",
          "It means the decline is irreversible",
          "It means reading was never as valuable as claimed",
        ],
        answer: 1,
        explanation:
          "A moral framing prescribes guilt. An environmental one prescribes changes you can actually make, to what is within reach, what is frictionless, what interrupts you.",
      },
      {
        id: "qr2",
        prompt: "What does the lecture claim sustained reading does that other input does not?",
        options: [
          "It transfers information more efficiently than video",
          "It rebuilds the machinery of attention itself, not just its contents",
          "It is more enjoyable once the habit is established",
          "It provides better social signalling",
        ],
        answer: 1,
        explanation:
          "The claim is about the apparatus, not the payload. Holding a long argument in mind is the exercise; whatever the book was about is almost incidental.",
      },
      {
        id: "qr3",
        prompt: "On this argument, what is wrong with reading only summaries?",
        options: [
          "Summaries are usually inaccurate",
          "They deliver conclusions while skipping the sustained attention that was the point",
          "They are too short to be worth the time",
          "Nothing, summaries are an efficient substitute",
        ],
        answer: 1,
        explanation:
          "A summary hands you the output of someone else's thinking. The value was in doing the thinking, which is exactly the part a summary removes.",
      },
    ],
  },

  "lust-is-a-leash": {
    questions: [
      {
        id: "ll1",
        prompt: "What is the lecture's central claim about sexual desire?",
        options: [
          "It is shameful and should be eliminated",
          "It is harmless as long as it is not acted on",
          "It is the most exploited vulnerability in the mind, and steers attention and decisions more than most people realise",
          "It is a purely biological drive with no bearing on judgement",
        ],
        answer: 2,
        explanation:
          "The argument is not moral. It is about a lever that other parties know how to pull, and how much of your attention and choosing it quietly directs.",
      },
      {
        id: "ll2",
        prompt: "Why does the lecture emphasise examination over suppression?",
        options: [
          "Because suppression is impossible for most people",
          "Because an unexamined drive steers you invisibly, while an examined one can be accounted for",
          "Because examination eventually removes the desire",
          "Because suppression is morally worse",
        ],
        answer: 1,
        explanation:
          "You cannot correct for a force you refuse to look at. Seeing where it is pulling is what makes the pull optional rather than automatic.",
      },
      {
        id: "ll3",
        prompt: "What does calling it 'a leash' imply?",
        options: [
          "That it is a small inconvenience",
          "That the constraint is external and easily removed",
          "That you are being led, and that the direction is chosen by whoever holds the other end",
          "That desire is a punishment",
        ],
        answer: 2,
        explanation:
          "The metaphor is about direction, not restraint. A leash does not stop you moving; it decides where the movement goes.",
      },
    ],
  },

  "anger-decoded": {
    questions: [
      {
        id: "ad1",
        prompt: "What does the lecture say anger actually is?",
        options: [
          "A character flaw to be trained out",
          "Information about a crossed boundary or a thwarted value",
          "An instruction that should generally be followed",
          "A purely physiological event with no content",
        ],
        answer: 1,
        explanation:
          "Anger reports something: a line crossed, a value blocked. Treating it as noise loses the report; treating it as an order loses you.",
      },
      {
        id: "ad2",
        prompt: "What is the distinction between being used by anger and using it?",
        options: [
          "Whether you express it or contain it",
          "Whether it is justified by the situation",
          "Whether you read the signal while declining the command it comes packaged with",
          "Whether you feel it strongly or mildly",
        ],
        answer: 2,
        explanation:
          "The signal and the command arrive together. Keeping the first and refusing the second is the whole skill, and it is not the same as bottling it up.",
      },
      {
        id: "ad3",
        prompt:
          "Someone never gets angry and considers this a strength. What would this lecture say?",
        options: [
          "It is the ideal state and should be the goal",
          "It may mean they have stopped registering boundaries being crossed, which is a loss of information",
          "It proves they have mastered emotional regulation",
          "It is impossible and they are lying",
        ],
        answer: 1,
        explanation:
          "If anger is information, its total absence is not mastery; it is a sensor that has stopped reporting. The aim is reading it well, not silencing it.",
      },
    ],
  },

  "sleep-is-the-floor": {
    questions: [
      {
        id: "sf1",
        prompt: "Why is sleep described as 'the floor' rather than one habit among many?",
        options: [
          "Because it is the easiest habit to fix",
          "Because nearly every other capacity (judgement, mood, discipline, physical progress) degrades downstream of it",
          "Because it takes the most hours",
          "Because it is the habit people most enjoy",
        ],
        answer: 1,
        explanation:
          "It is not parallel to the other work; it is underneath it. Short sleep does not cost you one thing, it quietly discounts everything at once.",
      },
      {
        id: "sf2",
        prompt: "Why does chronic under-sleeping feel like virtuous effort?",
        options: [
          "Because the hours look like productivity while the cost is invisible and delayed",
          "Because tired people genuinely work better",
          "Because society rewards early risers",
          "Because sleep debt does not accumulate",
        ],
        answer: 0,
        explanation:
          "You can see the hours you bought. You cannot see the judgement you sold to buy them, which is why the trade keeps looking good from the inside.",
      },
      {
        id: "sf3",
        prompt: "What does the lecture imply about self-assessment when under-slept?",
        options: [
          "People accurately notice their own impairment and compensate",
          "The faculty doing the assessing is itself impaired, so the deficit is systematically underestimated",
          "Impairment shows up mainly as sleepiness, which is easy to detect",
          "Self-assessment is unaffected; only performance drops",
        ],
        answer: 1,
        explanation:
          "You are grading yourself with the instrument that is out of calibration. That is why people short on sleep reliably believe they are fine.",
      },
    ],
  },

  "the-body-you-think-from": {
    questions: [
      {
        id: "bt1",
        prompt: "What is the lecture's core claim about mind and body?",
        options: [
          "The mind is housed in the body but operates independently of it",
          "The mind is produced by the body, so training the body is a direct intervention on thinking and mood",
          "Physical training matters only for physical outcomes",
          "Mental work should always take priority over physical",
        ],
        answer: 1,
        explanation:
          "Not a container but a source. That is why training is not a lesser, separate pursuit; it is one of the more direct levers available on focus and self-command.",
      },
      {
        id: "bt2",
        prompt: "What follows from treating physical training as a lesser pursuit?",
        options: [
          "Nothing important; the priority is correct",
          "You neglect one of the most reliable interventions on the very faculties you are trying to sharpen",
          "You will have more time for reading",
          "Your thinking improves through specialisation",
        ],
        answer: 1,
        explanation:
          "Ranking it below 'mental' work assumes a separation the lecture denies. The cost is giving up leverage on mood, resilience and attention.",
      },
      {
        id: "bt3",
        prompt: "How does this reframe motivation for training?",
        options: [
          "It becomes about appearance, which is a more honest motive",
          "It becomes about capability of thought and self-command, not just health or looks",
          "It becomes unnecessary once you understand the theory",
          "It becomes a matter of discipline alone",
        ],
        answer: 1,
        explanation:
          "If cognition runs on the body, then training is not vanity or even only health. It is maintenance on the thing you think with.",
      },
    ],
  },

  "why-you-should-learn-to-fight": {
    questions: [
      {
        id: "wf1",
        prompt: "What does the lecture say martial training is actually for?",
        options: [
          "Learning to win physical confrontations",
          "Physical conditioning that happens to be interesting",
          "Composure, staying deliberate while the body is genuinely under threat",
          "Deterrence through visible capability",
        ],
        answer: 2,
        explanation:
          "Violence is the medium, not the point. What is being trained is the ability to keep choosing while your physiology is screaming at you not to.",
      },
      {
        id: "wf2",
        prompt: "Why is the calm it produces described as impossible to fake?",
        options: [
          "Because it is tested under real threat rather than imagined",
          "Because it takes many years to acquire",
          "Because it is visible in a person's posture",
          "Because other people can detect insincerity",
        ],
        answer: 0,
        explanation:
          "Composure you have only rehearsed in your head has never met the thing it is for. The training supplies the genuine threat, which is the whole reason it transfers.",
      },
      {
        id: "wf3",
        prompt:
          "What does this suggest about calm acquired only through reading or reflection?",
        options: [
          "It is equivalent, since the mechanism is understanding",
          "It is untested, and untested composure tends to fail exactly when it is needed",
          "It is superior because it avoids injury",
          "It is impossible to acquire that way at all",
        ],
        answer: 1,
        explanation:
          "The lecture's claim is about load. Anything that has only been thought about has not yet been shown to hold.",
      },
    ],
  },

  "the-long-game": {
    questions: [
      {
        id: "lg1",
        prompt: "What does the lecture mean by choosing leverage over force?",
        options: [
          "Working smarter by finding shortcuts",
          "Preferring positions and advantages that compound to effort that must be repeated",
          "Delegating work to other people",
          "Avoiding hard work wherever possible",
        ],
        answer: 1,
        explanation:
          "Force is linear and has to be spent again tomorrow. Leverage keeps paying, which is why the same effort in different positions produces wildly different outcomes.",
      },
      {
        id: "lg2",
        prompt:
          "The lecture says the world has been engineered to make everyone play short. What does that imply about long-game players?",
        options: [
          "They are competing against a shrinking field, because most people are structurally pulled out of it",
          "They will be rewarded quickly for their patience",
          "They should ignore incentives entirely",
          "The advantage has been arbitraged away",
        ],
        answer: 0,
        explanation:
          "If the environment reliably pulls people into short horizons, then long horizons are not just virtuous; they are uncrowded.",
      },
      {
        id: "lg3",
        prompt: "Why does pursuing results without needing recognition matter here?",
        options: [
          "Recognition is morally suspect",
          "Needing recognition forces you onto short timescales, because recognition arrives on short ones",
          "Recognition is always undeserved",
          "It does not matter; it is a stylistic preference",
        ],
        answer: 1,
        explanation:
          "Applause is paid out quickly. If you need it, you are structurally obliged to chase things that produce it quickly, which rules out most of what compounds.",
      },
    ],
  },
};

export function getQuiz(slug: string): Quiz | null {
  return QUIZZES[slug] ?? null;
}

export function hasQuiz(slug: string): boolean {
  return slug in QUIZZES;
}

/**
 * A question with the answer taken out.
 *
 * This is the only form that reaches the browser. It matters now in a way it
 * did not before: a correct first answer is worth points, and an answer key
 * sitting in the client bundle would mean the examinations paid out to anyone
 * willing to open devtools instead of read. The correct option and its
 * explanation come back from the server action, one question at a time, after
 * an answer has been committed.
 */
export interface PublicQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface PublicQuiz {
  questions: PublicQuestion[];
}

export function publicQuiz(quiz: Quiz): PublicQuiz {
  return {
    questions: quiz.questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
  };
}
