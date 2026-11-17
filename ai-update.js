const ai = window.SUBJECT_DATA.aiml;
const additions = [
  [
    "ai-tokens",
    "How language models generate text",
    "A model splits input into tokens, uses attention to build contextual representations, and estimates probabilities for the next token. Repeating this step creates a response.",
    "Ask for a sales forecast twice. Different wording can follow from sampling different plausible tokens. Validate the forecast against actual data.",
    "What does next-token prediction estimate?",
    "A probability distribution over possible next tokens",
    [
      "A verified fact from a database",
      "A single fixed sentence",
      "The author of the prompt",
    ],
  ],
  [
    "ai-check",
    "Recognising and mitigating LLM errors",
    "Fluent answers can contain unsupported details. Training data can encode bias or omit recent changes. Separate factual claims from interpretations and check each material claim against a trusted source.",
    "A model invents a refund policy. Supply the current policy, ask for the supporting passage, and check it before replying to a customer.",
    "What is the strongest check on a generated refund-policy claim?",
    "Compare the claim with the current authoritative policy",
    [
      "Ask for a more confident answer",
      "Generate a longer explanation",
      "Accept agreement across repeated prompts",
    ],
  ],
  [
    "ai-zero",
    "Designing a zero-shot prompt",
    "A zero-shot task gives instructions without worked examples. Specify the goal, allowed labels, output format and what to do when evidence is missing. Test on cases near the decision boundary.",
    "Classify feedback as delivery, product, billing or other. Return one label. If no category fits, use other. Apply the instruction to a new review before adding examples.",
    "Which prompt is zero-shot classification?",
    "An instruction with allowed labels and no labelled examples",
    [
      "An instruction with two labelled examples",
      "Retraining on every review",
      "Looking up a previously assigned label",
    ],
  ],
  [
    "ai-churn",
    "Using a churn dataset responsibly",
    "Define churn and choose a prediction date. Use information available by that date. Keep later customers or periods for evaluation. Compare against a simple baseline and inspect missed churners and false alarms.",
    "A cancellation date is recorded after departure. Including it in training leaks the outcome. Drop that field and evaluate again on held-out customers.",
    "Which feature leaks the outcome in a pre-cancellation forecast?",
    "A cancellation date recorded after departure",
    [
      "Number of prior support tickets",
      "Customer tenure at prediction time",
      "Previous monthly bill",
    ],
  ],
];
for (const [id, title, body, example, q, answer, others] of additions) {
  ai.notes.push({
    id,
    unit: "u1",
    lec: "Unit 1",
    title,
    sum: body,
    html: "<p>" + body + "</p><h3>Worked example</h3><p>" + example + "</p>",
  });
  ai.bank.push([id, q, answer, others, body]);
  ai.cards.push([id, q, answer]);
}
for (const n of ai.notes)
  if (n.lec.includes("Beyond syllabus")) n.lec = "Unit 1";
