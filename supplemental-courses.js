import { starterBanks } from "./quiz-bank.js";

const topics = {
  dviz: [
    ["viz-choice", "Choosing a chart", "A bar chart compares categories by length. A line chart emphasizes change over ordered time. A scatterplot compares two numerical variables. Choose the chart that answers the reader’s question and label the units.", "Plot weekly footfall over eight weeks and compare average footfall across three stores. Use a line chart for the timeline and bars for the store comparison.", "Which chart shows the relationship between advertising spend and revenue across 40 campaigns?", "Scatterplot", ["Pie chart", "Single-value card", "Stacked area chart"], "A point represents each campaign’s pair of numeric measurements."],
    ["viz-integrity", "Scales and fair comparisons", "A bar baseline should usually be zero because bar length encodes magnitude. Show consistent units, date ranges and denominators. Report the underlying count with percentages when sample sizes differ.", "Compare 25 of 100 orders with 40 of 200. The first period has fewer returns but a higher return rate: 25% versus 20%.", "Which value helps compare return rates from stores with very different sales volumes?", "Returns divided by orders for each store", ["Raw returns alone", "Largest store’s orders for both rates", "Average order value"], "Use each store’s own denominator to compare like with like."],
    ["viz-dashboard", "Designing an accessible dashboard", "Start with the decision the viewer needs to make. Lead with the key measures, place trends and breakdowns nearby, and label filters. Use text, shapes or labels alongside colour.", "Create a one-screen inventory dashboard with stock-outs, a weekly trend, and a product category filter. Check whether every alert makes sense in grayscale.", "How should a dashboard indicate low inventory accessibly?", "Use an explicit label or icon alongside colour", ["Use red alone", "Hide the threshold", "Put every metric in one chart"], "Redundant cues help readers who cannot distinguish the colours."],
  ],
  drm: [
    ["rep-monitor", "Monitoring and triage", "Define search terms for the brand and common variants. Check the date, source and context before classifying a mention. Separate urgent service or safety issues from routine feedback and record the supporting evidence privately.", "Sort a delayed delivery complaint, an unrelated use of the brand name, and a recurring quality issue. Escalate the recurring issue and route the delivery complaint to support.", "What should a team do first after spotting a post that might refer to its brand?", "Verify the source and context", ["Respond before reading it", "Assume every mention is relevant", "Delete the brand’s profile"], "Context determines whether the post belongs in the monitoring queue."],
    ["rep-response", "Public replies and escalation", "A useful reply acknowledges the report, explains one next step and avoids exposing private details. Use a private channel for case identifiers. Document ownership, expected update time and escalation triggers.", "Write a public reply to a missing-refund complaint, then draft a private follow-up that asks for the minimum details needed to find the case.", "Where should a team request an order identifier tied to a customer?", "A verified private support channel", ["A public thread", "A shared public spreadsheet", "A group poll"], "Private channels limit exposure and let the team verify the case."],
    ["rep-metrics", "Measuring reputation work", "Track response time, resolution rate and repeat issues, alongside mention volume and sentiment. Define your denominator and time window. Platform data covers the people posting there, so it may miss other customers.", "Of 80 logged cases, 52 were resolved within the window. Report a 65% resolution rate and investigate the largest unresolved category.", "What makes a resolution rate interpretable?", "A clear denominator and measurement window", ["A larger chart title", "Removing unresolved cases", "Combining all comments into one word"], "Rates require a defined set of eligible cases and a consistent time period."],
  ],
  arts: [
    ["arts-voice", "Voice, tempo and phrasing", "Tempo is the pace of the beat. Dynamics describe loudness. Phrasing groups sounds or words into meaningful units. Changing any one can alter how an audience interprets a performance.", "Read a four-line passage twice. Keep volume steady but place a pause in a different spot. Ask a listener which word felt most important and why.", "What changes when a performer makes a crescendo?", "The sound gradually becomes louder", ["The beat always speeds up", "The script changes", "The stage lights switch off"], "A crescendo is a dynamic change in volume."],
    ["arts-stage", "Blocking and stage cues", "Blocking plans where performers move and stand. A cue signals the start of an action such as an entrance or a lighting change. Record cues against a spoken line or another observable event.", "Plan a two-person entrance and one lighting change. Mark the trigger line and rehearse the transition twice.", "What does blocking primarily document?", "Where performers stand and move", ["Ticket prices", "Soundtrack copyright", "Audience size"], "Blocking coordinates movement and sightlines."],
    ["arts-rehearse", "Rehearsal and feedback", "Run a scene with a clear goal, collect specific observations, and change one thing before repeating it. A technical rehearsal checks lights, sound and transitions. A reflective note links the change to its effect on the audience.", "Rehearse the same scene once with a pause and once without. Ask observers what changed in tension and cite a specific moment.", "Which comment is most actionable after a rehearsal?", "Hold the pause after the second line so the response can land", ["Make it better", "Change everything", "The performance was fine"], "Specific feedback names an observable action and explains its purpose."],
  ],
};

export function loadSupplementalCourses() {
  for (const [course, rows] of Object.entries(topics)) {
    const notes = rows.map(([id, title, sum, exercise, question, answer]) => ({
      id, title, sum, unit: "foundations", lec: "Foundation",
      html: "<p>" + sum + "</p><h3>Practical exercise</h3><p>" + exercise +
        "</p><h3>Exam-style application</h3><p>" + question + " Explain the reasoning and apply it to a new example.</p>" +
        "<details><summary>Marking points</summary><p>" + answer + ". Define the concept, justify your answer, and give a relevant example.</p></details>",
    }));
    window.SUBJECT_DATA[course] = {
      units: [{id:"foundations", name:"Foundations", title:"Original study materials", w:1}],
      notes,
      guide: "<p>Read the three foundation lessons, then test your recall and practise under a time limit.</p>",
      revision: {foundations: "<ul>" + notes.map(note => "<li>" + note.sum + "</li>").join("") + "</ul>"},
      cards: rows.map(([id, , , , question, answer]) => [id, question, answer]),
      bank: [...starterBanks[course], ...rows.map(([id, , , , question, answer, distractors, why]) => [id, question, answer, distractors, why])],
    };
  }
}
