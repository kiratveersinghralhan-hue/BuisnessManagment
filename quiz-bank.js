// Original introductory practice for subjects whose CULMS units are pending.
const starters = {
  dviz: [
    [
      "Which chart best shows revenue changing month by month?",
      "Line chart",
      "Pie chart",
      "Histogram",
      "Box plot",
      "A line connects observations in time order.",
    ],
    [
      "Which visual compares sales across five stores most directly?",
      "Bar chart",
      "Contour map",
      "Scatter plot",
      "Gauge",
      "Bar lengths let you compare categories against one scale.",
    ],
    [
      "You want to inspect the distribution of delivery times. Which chart groups values into intervals?",
      "Histogram",
      "Line chart",
      "Pie chart",
      "Network diagram",
      "A histogram counts observations within numeric bins.",
    ],
    [
      "Which chart helps investigate whether two numeric measurements vary together?",
      "Scatter plot",
      "Stacked bar chart",
      "Treemap",
      "Pie chart",
      "Each point represents a pair of measurements.",
    ],
    [
      "Why start a bar chart’s value axis at zero?",
      "Bar length represents magnitude",
      "All data are positive",
      "Labels become optional",
      "It removes outliers",
      "A truncated baseline exaggerates differences in length.",
    ],
    [
      "How can a chart distinguish series for readers with colour-vision differences?",
      "Use direct labels and distinct line patterns",
      "Use only red and green",
      "Remove the legend",
      "Reduce text contrast",
      "Labels and patterns communicate the distinction without relying on colour.",
    ],
  ],
  drm: [
    [
      "A customer posts a credible complaint. What is the best first public response?",
      "Acknowledge it and offer a private route for account details",
      "Delete every negative reply",
      "Post the customer’s order history",
      "Promise a refund before checking",
      "Recognise the concern and protect private details while investigating.",
    ],
    [
      "Which measure describes the tone of mentions?",
      "Sentiment",
      "Reach",
      "Impressions",
      "Click-through rate",
      "Sentiment describes expressed attitudes such as positive, neutral or negative.",
    ],
    [
      "A rumour is spreading about a business. What should its team do before posting a correction?",
      "Verify the facts with a reliable source",
      "Repeat the rumour as fact",
      "Name an assumed source",
      "Publish customer records",
      "Evidence makes a correction accurate and credible.",
    ],
    [
      "Which example is earned media?",
      "An independent review",
      "A paid search ad",
      "A company newsletter",
      "A sponsored banner",
      "Earned media comes from independent coverage or discussion.",
    ],
    [
      "What makes a response to an error more accountable?",
      "Explain the correction and follow-up action",
      "Blame readers",
      "Hide the correction",
      "Use a vague slogan",
      "A specific correction helps readers understand what changed.",
    ],
    [
      "Which metric distinguishes engagement from exposure?",
      "Replies and shares",
      "Number of displayed impressions",
      "Size of potential audience",
      "Ad placement count",
      "Replies and shares reflect actions people actually took.",
    ],
  ],
  arts: [
    [
      "What does blocking describe in theatre?",
      "The planned positions and movements of performers",
      "The pitch of a melody",
      "The lighting budget",
      "The rate of ticket sales",
      "Blocking organises movement and relationships in the playing space.",
    ],
    [
      "Which term describes the speed of a musical passage?",
      "Tempo",
      "Timbre",
      "Harmony",
      "Dynamics",
      "Tempo indicates the pace of the beat.",
    ],
    [
      "What does a crescendo ask a performer to do?",
      "Gradually increase loudness",
      "Slow to a stop",
      "Change key",
      "Repeat the opening",
      "A crescendo is an increase in musical intensity through volume.",
    ],
    [
      "What is a stage cue?",
      "A signal to begin an action",
      "The entire script",
      "A costume fitting",
      "A seating plan",
      "Cues coordinate entrances, sound, lighting and other events.",
    ],
    [
      "Which rehearsal helps the ensemble coordinate technical changes?",
      "Technical rehearsal",
      "Audition",
      "Table read only",
      "Public review",
      "A technical rehearsal tests cues, transitions and equipment together.",
    ],
    [
      "What can a deliberate pause communicate in a scene?",
      "A shift in thought or tension",
      "Only a forgotten line",
      "A fixed tempo marking",
      "A change of costume",
      "Silence can give the audience time to register a change in the scene.",
    ],
  ],
};

export const starterBanks = Object.fromEntries(
  Object.entries(starters).map(([id, rows]) => [
    id,
    rows.map(([q, a, b, c, d, why]) => [null, q, a, [b, c, d], why]),
  ]),
);

export function bankFor(id) {
  return window.SUBJECT_DATA?.[id]?.bank || starterBanks[id];
}

export function splitQuestion(raw) {
  const text = String(raw ?? "");
  const nl = text.indexOf("\n");
  if (nl === -1) return { prompt: text, code: "" };
  return {
    prompt: text.slice(0, nl).trim(),
    code: text.slice(nl + 1).replace(/^\n+/, ""),
  };
}

export function battleQuestions(subject, code) {
  let seed = 2166136261;
  for (const ch of code) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  return shuffle(bankFor(subject).slice())
    .slice(0, 5)
    .map(([note, q, a, others, why]) => ({
      note,
      q,
      a,
      why: why || "",
      choices: shuffle([a, ...others]),
    }));
}
