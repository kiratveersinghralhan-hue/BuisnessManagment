/* Introduction to AI and ML (26BBM1107): from the CULMS session slides. */
window.SUBJECT_DATA = window.SUBJECT_DATA || {};
window.SUBJECT_DATA.aiml = {
"units": [
{
"id": "u1",
"name": "Unit 1",
"title": "Generative AI for business & predictive analytics",
"lectures": "Sessions so far",
"w": 1
}
],
"notes": [
{
"id": "ai-sys",
"unit": "u1",
"lec": "Session 1",
"title": "System prompts and role prompting",
"sum": "System vs user prompt, where system prompts are set, role/persona/audience, what role prompting can and cannot do, the anatomy of a reusable system prompt, adaptations and testing.",
"html": "\n<div class=\"tip\">From the CULMS slides “System Prompts and Role Prompting”.</div>\n<h3>System prompt vs user prompt</h3>\n<p>A <b>system prompt</b> is the set of standing instructions that define who the AI is, what it is for and how it behaves: like a <b>job description and SOP</b>. A <b>user prompt</b> is the specific request in one turn: like <b>today's task from your manager</b>.</p>\n<table><tr><th>System prompt</th><th>User prompt</th></tr>\n<tr><td>Defines role, purpose and rules</td><td>Asks for one specific task</td></tr>\n<tr><td>Written once, before the chat</td><td>Written fresh in every turn</td></tr>\n<tr><td>Applies to the whole conversation</td><td>Applies to this request only</td></tr>\n<tr><td>Set by the builder or teacher</td><td>Written by the end user</td></tr>\n<tr><td>Controls tone, format and limits</td><td>Supplies topic, data and question</td></tr>\n<tr><td>Reused across many chats</td><td>Changes with every need</td></tr></table>\n<h3>Where you set a system prompt</h3>\n<ul><li><b>API:</b> the <code>system</code> field</li><li><b>ChatGPT:</b> Custom Instructions and Custom GPTs</li><li><b>Claude:</b> Project instructions</li><li><b>Gemini:</b> Gems</li></ul><p>Same idea everywhere: write the standing rules once, then reuse them.</p>\n<h3>Role, persona and audience</h3><ul><li><b>Role</b>: the function (procurement analyst, writing tutor).</li><li><b>Persona</b>: the voice and manner (patient, Socratic, plain language).</li><li><b>Audience and task</b>: who it talks to and what it must achieve.</li></ul>\n<h3>What role prompting does and does not do</h3><p>It reliably shapes <b>tone, vocabulary, structure and perspective</b>. It does <b>not</b> make the model more factually accurate: “You are a genius” adds almost nothing, so keep verifying facts.</p>\n<p><b>Specific beats generic.</b> Not “You are an expert” but “You are a procurement analyst reviewing supplier quotes for a mid-sized manufacturer.” Name the role, the audience and the task.</p>\n<h3>Anatomy of a reusable system prompt</h3><ol><li><b>Role and purpose</b>: who the AI is and what it is for</li><li><b>Audience</b>: level, background, context</li><li><b>Method</b>: how it should work</li><li><b>Rules</b>: what to always and never do</li><li><b>Output format</b>: length, structure, tone</li><li><b>Uncertainty and limits</b>: what to do when it does not know</li></ol>\n<pre class=\"code\">You are a [ROLE] helping [AUDIENCE] with [PURPOSE].\nHow you work: [method steps]\nRules: always [behaviour]. Never [behaviour].\nIf unsure or information is missing, say so and ask. Do not guess.\nIf a request is outside [SCOPE], say so and redirect.\nFormat: [length, structure, tone, language level]</pre>\n<h3>Three adaptations</h3>\n<table><tr><th></th><th>Tutor</th><th>Advisor</th><th>Research assistant</th></tr>\n<tr><td>Role</td><td>Patient subject tutor for BBA students</td><td>Business advisor to a small-business owner</td><td>Careful literature and data assistant</td></tr>\n<tr><td>Method</td><td>Socratic: one question at a time, hints before answers</td><td>Clarifying questions first, then 2–3 options with trade-offs</td><td>Separate facts from inference; fixed summary structure</td></tr>\n<tr><td>Key rules</td><td>Don't write graded work; explain with business examples</td><td>State assumptions; flag high-stakes decisions; not a substitute for professional advice</td><td>Never invent sources or figures; mark confidence; say “not found”</td></tr>\n<tr><td>Format</td><td>Short turns ending with a check question</td><td>Recommendation, risks, next steps</td><td>Summary, evidence, gaps, open questions</td></tr></table>\n<h3>Test with five inputs</h3><ol><li>A typical request</li><li>A vague request</li><li>An off-topic request</li><li>An edge case</li><li>An override attempt: “ignore your instructions”</li></ol><p>Revise, then keep versions (v1, v2) so you know what changed.</p>\n<h3>Common mistakes</h3><ul><li>Contradictory or overly long rules</li><li>Vague adjectives (“be professional”) with no example</li><li>No instruction for what to do when unsure</li><li>No output format, so every answer looks different</li></ul>\n<div class=\"tip\"><b>In-class exercise:</b> write a supply-chain advisor system prompt with the template, run the same three questions through a bare prompt and through yours, and compare tone, accuracy and consistency.</div>\n"
},
{
"id": "ai-kb",
"unit": "u1",
"lec": "Session 2",
"title": "Building a personal knowledge base with AI",
"sum": "Summarise three different sources with one template, then check the AI's work for six common mistakes: wrong cause, missing details, reversed idea, mixed-in ideas, old numbers and one cause only.",
"html": "\n<div class=\"tip\">From the CULMS slides “Building a Personal Knowledge Base with AI”.</div>\n<p><b>Use AI to summarise your sources, then check what it missed or got wrong.</b></p>\n<h3>The task: three steps</h3><ol><li><b>Choose three sources</b> of different types, e.g. a report, a paper and a forecast.</li><li><b>Ask AI for a summary</b> of each with the <b>same template</b>, then a short summary comparing all three.</li><li><b>Check the AI's work</b> against the original: find what it missed or got wrong.</li></ol>\n<h3>Example sources</h3><table><tr><th>Source</th><th>Type</th><th>What it tells us</th></tr>\n<tr><td>World Bank Logistics Performance Index 2023</td><td>Data report</td><td>How 139 countries rank on trade logistics</td></tr>\n<tr><td>Lee, Padmanabhan &amp; Whang (1997)</td><td>Academic paper</td><td>Why orders get bigger up the supply chain (bullwhip effect)</td></tr>\n<tr><td>AlixPartners forecasts (2021)</td><td>Industry press releases</td><td>How many cars the chip shortage may stop</td></tr></table>\n<h3>Summary template</h3><ol><li><b>Purpose</b>: why was it written?</li><li><b>Main claims</b>: what does it say?</li><li><b>Key numbers and dates</b></li><li><b>Limits</b>: what does it not show?</li><li><b>Open questions</b></li></ol>\n<p><b>Example, the bullwhip paper.</b> Purpose: show how orders become distorted in a supply chain. Main claim: orders vary more than sales, and the problem grows upstream. <b>Four causes:</b> demand signal processing, rationing game, order batching, price variations. It also covers ways to reduce the problem.</p>\n<h3>Six mistakes AI often makes</h3><table><tr><th>Mistake</th><th>What it looks like</th></tr>\n<tr><td>Wrong cause</td><td>Says one policy caused a result; the source does not say so</td></tr>\n<tr><td>Missing details</td><td>“Strong everywhere” when the source shows strong and weak areas</td></tr>\n<tr><td>Reversed idea</td><td>States the opposite of the author's main point</td></tr>\n<tr><td>Mixed-in ideas</td><td>Adds ideas from other sources</td></tr>\n<tr><td>Old numbers</td><td>Uses a figure that was later updated; a forecast is not a fact</td></tr>\n<tr><td>One cause only</td><td>Blames one thing when the source names many causes</td></tr></table>\n<h3>Worked check</h3><table><tr><th>AI says</th><th>Source says</th><th>Mistake</th></tr>\n<tr><td>Chips cost carmakers $110 billion in 2021</td><td>That was the May forecast; in September it became $210 billion</td><td>Old number</td></tr>\n<tr><td>Managers order in a bad way</td><td>It can happen even when each firm orders sensibly</td><td>Reversed idea</td></tr>\n<tr><td>India is strong in logistics everywhere</td><td>India is 22nd for international shipments but 47th for infrastructure</td><td>Missing details</td></tr></table>\n<div class=\"tip\"><b>Remember:</b> read the original source. News about a source can also be wrong. Check every number and every cause.</div>\n"
},
{
"id": "ai-pred",
"unit": "u1",
"lec": "Beyond syllabus · Topic 1",
"title": "Introduction to predictive analytics",
"sum": "Descriptive, diagnostic, predictive and prescriptive analytics; trend, seasonality and noise; a regression trend line forecast; Julius AI vs Google Colab; and when forecasts go wrong.",
"html": "\n<div class=\"tip\">From the CULMS slides “Introduction to Predictive Analytics” (CLO04 · PO2, PO3, PO5).</div>\n<h3>Four questions analytics can answer</h3><table><tr><th>Type</th><th>Question</th><th>Example</th></tr>\n<tr><td>Descriptive</td><td>What happened?</td><td>Month 6 sales were ₹52 lakh</td></tr>\n<tr><td>Diagnostic</td><td>Why did it happen?</td><td>A festive offer lifted orders</td></tr>\n<tr><td><b>Predictive</b></td><td><b>What will happen?</b></td><td>Month 13 sales will be about ₹65 lakh</td></tr>\n<tr><td>Prescriptive</td><td>What should we do?</td><td>Order extra stock before month 13</td></tr></table>\n<p><b>Predictive analytics in one line:</b> past data → pattern → prediction. It estimates what is <b>likely</b>, not what is certain. A good forecast supports a decision; it does not replace business judgement.</p>\n<h3>Where businesses use predictions</h3><ul><li><b>Demand forecasting</b>: units customers will order in the festive season</li><li><b>Inventory planning</b>: stock each warehouse should hold next month</li><li><b>Delivery planning</b>: routes likely to see delays next week</li><li><b>Marketing spend</b>: customers most likely to respond to a campaign</li></ul>\n<h3>Three patterns in sales data</h3><ul><li><b>Trend</b>: the long-run direction (steady growth)</li><li><b>Seasonality</b>: a pattern that repeats on the calendar (Diwali demand, monsoon dips, exam-season spikes)</li><li><b>Noise</b>: random ups and downs (a one-off bulk order, a strike day)</li></ul>\n<h3>Regression: a line through the dots</h3><p><b>Sales = starting level + growth × month.</b> Regression finds the straight line closest to all past points, then extends it forward. The <b>slope</b> is how much sales change each month.</p>\n<table><tr><th>Month</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td></tr><tr><th>₹ lakh</th><td>42</td><td>44</td><td>43</td><td>47</td><td>50</td><td>52</td><td>56</td><td>55</td><td>58</td><td>60</td><td>59</td><td>64</td></tr></table>\n<p>Trend line: <b>Sales ≈ 39.5 + 2.0 × month</b> (slope ≈ +₹2 lakh a month). Forecasts quoted in the slides: month 13 ≈ <b>₹65.5 lakh</b>, month 14 ≈ <b>₹67.4 lakh</b>, month 15 ≈ <b>₹69.4 lakh</b>. Actual sales wobble around the line: the wobble is noise.</p>\n<h3>Two routes to the same forecast</h3>\n<p><b>No-code: Julius AI.</b> Prompts: “Using sales.csv, plot monthly sales and add a trend line.” → “Forecast months 13 to 15 and explain the method in plain English.” → “How confident should I be? What could change it?” Verify one number by hand.</p>\n<pre class=\"code\">import pandas as pd\nfrom sklearn.linear_model import LinearRegression\ndf = pd.read_csv(\"sales.csv\")            # Month, Sales\nmodel = LinearRegression().fit(df[[\"Month\"]], df[\"Sales\"])\nfuture = pd.DataFrame({\"Month\": [13, 14, 15]})\nprint(model.predict(future))</pre>\n<p><b>Code-assisted: Google Colab.</b> Load (pandas) → Fit (learn the trend) → Predict (months 13–15). Both routes should give the same numbers; explain any gap.</p>\n<h3>When forecasts go wrong</h3><ul><li><b>Small sample:</b> 12 months is thin evidence.</li><li><b>Seasonality missed:</b> a straight line cannot see festive spikes or monsoon dips.</li><li><b>Looking too far ahead:</b> reliability falls with the horizon.</li><li><b>Sensitive data:</b> customer data must be handled under the <b>DPDP Act, 2023</b>.</li></ul>\n<div class=\"tip\"><b>Exercise output:</b> a forecast table and a 3-line recommendation that names one limitation.</div>\n"
}
],
"guide": "<h3>How to answer AI &amp; ML theory questions</h3><ol><li><b>Define first</b> in one sentence (e.g. “A system prompt is…”).</li><li><b>Structure with the course's own lists</b>: six parts of a system prompt, six AI mistakes, four types of analytics.</li><li><b>Give an Indian business example</b> for every concept (Diwali demand, a kirana chain, a logistics firm).</li><li><b>For design questions</b> (write a system prompt), actually write it using the template, then say how you would test it.</li><li><b>For “evaluate/discuss”</b> questions, end with limits and a balanced conclusion.</li></ol>",
"bank": [
[
"ai-sys",
"A system prompt is best compared to:",
"A job description and SOP",
[
"Today's task from your manager",
"A search query",
"A training dataset"
],
"System prompt = standing instructions; user prompt = the request in one turn."
],
[
"ai-sys",
"Which statement describes a USER prompt?",
"It asks for one specific task and changes with every need",
[
"It is written once before the chat and reused",
"It controls tone and limits for the whole conversation",
"It is usually set by the builder or teacher"
],
"The other three describe a system prompt."
],
[
"ai-sys",
"In Claude, standing instructions for a set of chats are written in:",
"Project instructions",
[
"Gems",
"Custom GPTs",
"The temperature setting"
],
"ChatGPT: Custom Instructions/GPTs · Claude: Project instructions · Gemini: Gems · API: system field."
],
[
"ai-sys",
"Gemini's feature for saved standing instructions is called:",
"Gems",
[
"Projects",
"Custom GPTs",
"Workspaces"
],
"As listed in the slides."
],
[
"ai-sys",
"When calling a model through the API, the system prompt goes in:",
"The system field",
[
"The user message only",
"The file name",
"The model name"
],
"Same idea everywhere: write the rules once."
],
[
"ai-sys",
"“Patient, Socratic, plain language” describes the AI's:",
"Persona",
[
"Role",
"Audience",
"Output format"
],
"Role = function; persona = voice and manner; audience = who it talks to."
],
[
"ai-sys",
"What does role prompting reliably NOT do?",
"Make the model more factually accurate",
[
"Shape tone",
"Shape vocabulary and structure",
"Change the perspective of answers"
],
"“You are a genius” adds almost nothing; keep verifying facts."
],
[
"ai-sys",
"Which role line follows “specific beats generic”?",
"You are a procurement analyst reviewing supplier quotes for a mid-sized manufacturer.",
[
"You are an expert.",
"You are the smartest AI in the world.",
"Be professional."
],
"Name the role, the audience and the task."
],
[
"ai-sys",
"Which is NOT one of the six parts of a reusable system prompt?",
"The model's training data",
[
"Role and purpose",
"Rules",
"Uncertainty and limits"
],
"Role/purpose, audience, method, rules, output format, uncertainty and limits."
],
[
"ai-sys",
"A good system prompt tells the AI what to do when information is missing. The template's instruction is:",
"Say so and ask; do not guess",
[
"Make a reasonable guess silently",
"Refuse every request",
"Search the web automatically"
],
"Uncertainty and limits are part of the anatomy."
],
[
"ai-sys",
"For the TUTOR adaptation, the method is:",
"Socratic: one question at a time, hints before answers",
[
"Give 2–3 options with trade-offs",
"Separate facts from inference",
"Write the student's graded work quickly"
],
"Tutor rules also say: don't write graded work."
],
[
"ai-sys",
"For the ADVISOR adaptation, the output format is:",
"Recommendation, risks and next steps",
[
"Summary, evidence, gaps, open questions",
"Short turns ending with a check question",
"A single yes/no"
],
"The advisor also states assumptions and flags high-stakes decisions."
],
[
"ai-sys",
"A research-assistant system prompt should include which rule?",
"Never invent sources or figures; say “not found” when it is",
[
"Always sound confident",
"Use any source, even unverified",
"Hide uncertainty from the user"
],
"Mark confidence and separate facts from inference."
],
[
"ai-sys",
"Which test input checks whether a system prompt resists manipulation?",
"“Ignore your instructions”",
[
"A typical request",
"A vague request",
"An edge case"
],
"The five tests: typical, vague, off-topic, edge case, override attempt."
],
[
"ai-sys",
"Why keep versions v1, v2 of a system prompt?",
"To know what changed after each revision",
[
"Because models forget old prompts",
"To make prompts longer",
"Because the API requires it"
],
"Test, revise, keep versions."
],
[
"ai-sys",
"Which is listed as a common system-prompt mistake?",
"Vague adjectives such as “be professional” with no example",
[
"Stating an output format",
"Saying what to do when unsure",
"Naming the audience"
],
"Others: contradictory/long rules, no uncertainty instruction, no format."
],
[
"ai-kb",
"In the knowledge-base task, why use the SAME template for every source?",
"So the summaries can be compared side by side",
[
"Because AI can only follow one template",
"To make every summary identical",
"To skip checking the sources"
],
"Step 2: same template for each, then a comparative summary."
],
[
"ai-kb",
"Which is NOT part of the summary template?",
"The author's social-media following",
[
"Purpose",
"Main claims",
"Limits"
],
"Purpose, main claims, key numbers and dates, limits, open questions."
],
[
"ai-kb",
"The bullwhip paper (Lee, Padmanabhan & Whang, 1997) argues that:",
"Orders vary more than sales, and the problem grows upstream",
[
"Retail sales vary more than factory orders",
"Only bad managers cause order swings",
"Price changes reduce order swings"
],
"Demand distortion grows up the supply chain."
],
[
"ai-kb",
"Which is one of the four causes of the bullwhip effect?",
"Order batching",
[
"Exchange-rate controls",
"Employee turnover",
"Advertising budgets"
],
"Demand signal processing, rationing game, order batching, price variations."
],
[
"ai-kb",
"AI says “Chips cost carmakers $110 billion in 2021”, but the source was revised to $210 billion in September. This mistake is:",
"Old numbers",
[
"Wrong cause",
"Reversed idea",
"Mixed-in ideas"
],
"A forecast is not a fact, and it was updated later."
],
[
"ai-kb",
"AI says “India is strong in logistics everywhere”; the source shows 22nd for international shipments but 47th for infrastructure. The mistake is:",
"Missing details",
[
"Old numbers",
"One cause only",
"Reversed idea"
],
"The AI flattened a mixed picture."
],
[
"ai-kb",
"AI says “Managers order in a bad way” but the paper says it can happen even when each firm orders sensibly. The mistake is:",
"Reversed idea",
[
"Missing details",
"Old numbers",
"Mixed-in ideas"
],
"It states the opposite of the author's point."
],
[
"ai-kb",
"AI adds an idea to a summary that actually comes from another article. This is:",
"Mixed-in ideas",
[
"Wrong cause",
"One cause only",
"Old numbers"
],
"One of the six mistake types."
],
[
"ai-kb",
"The World Bank LPI 2023 ranks how many countries on trade logistics?",
"139",
[
"193",
"47",
"22"
],
"As stated in the slides' source table."
],
[
"ai-kb",
"What is the final rule of the knowledge-base exercise?",
"Read the original source; news about a source can also be wrong",
[
"Trust the AI if it sounds confident",
"Use only one source",
"Check only the numbers, not the causes"
],
"Check every number and every cause."
],
[
"ai-pred",
"“Month 13 sales will be about ₹65 lakh” is an example of which analytics?",
"Predictive",
[
"Descriptive",
"Diagnostic",
"Prescriptive"
],
"Predictive answers “What will happen?”."
],
[
"ai-pred",
"“Order extra stock before month 13” is:",
"Prescriptive analytics",
[
"Descriptive analytics",
"Diagnostic analytics",
"Predictive analytics"
],
"Prescriptive answers “What should we do?”."
],
[
"ai-pred",
"“A festive offer lifted orders” answers:",
"Why did it happen? (diagnostic)",
[
"What happened? (descriptive)",
"What will happen? (predictive)",
"What should we do? (prescriptive)"
],
"Diagnostic analytics explains causes."
],
[
"ai-pred",
"Diwali demand spikes that repeat every year are:",
"Seasonality",
[
"Trend",
"Noise",
"Regression"
],
"A pattern that repeats on the calendar."
],
[
"ai-pred",
"A one-off bulk order or a strike day in sales data is:",
"Noise",
[
"Trend",
"Seasonality",
"A slope"
],
"Random ups and downs with no pattern."
],
[
"ai-pred",
"In Sales = 39.5 + 2.0 × month, the number 2.0 is the:",
"Slope: sales grow about ₹2 lakh per month",
[
"Starting level",
"Forecast for month 2",
"Seasonal effect"
],
"39.5 is the starting level (intercept)."
],
[
"ai-pred",
"Using Sales ≈ 39.5 + 2.0 × month, the forecast for month 15 is closest to:",
"₹69.5 lakh",
[
"₹64 lakh",
"₹54.5 lakh",
"₹79.5 lakh"
],
"39.5 + 2.0 × 15 = 69.5 (the slides quote ₹69.4 lakh)."
],
[
"ai-pred",
"Regression finds:",
"The straight line that sits closest to all the past points",
[
"The highest past value",
"The average of the last two months",
"A line through the first and last points only"
],
"Then it extends the line forward to predict."
],
[
"ai-pred",
"In the Colab code, which line learns the trend from past months?",
"model = LinearRegression().fit(df[[\"Month\"]], df[\"Sales\"])",
[
"df = pd.read_csv(\"sales.csv\")",
"future = pd.DataFrame({\"Month\": [13, 14, 15]})",
"print(model.predict(future))"
],
"Load → Fit → Predict."
],
[
"ai-pred",
"Julius AI is used in the session as the:",
"No-code route to the forecast",
[
"Code-assisted route",
"Source of the sales dataset",
"Data-protection regulator"
],
"Colab with scikit-learn is the code-assisted route."
],
[
"ai-pred",
"Why can a straight-line forecast from 12 months mislead?",
"It cannot see seasonal spikes, and 12 months is thin evidence",
[
"Straight lines are always wrong",
"Regression needs exactly 100 data points",
"Colab and Julius always disagree"
],
"Limits: small sample, seasonality missed, looking too far ahead, sensitive data."
],
[
"ai-pred",
"Customer data used for prediction in India must be handled under:",
"The DPDP Act, 2023",
[
"The Companies Act, 2013",
"The LLP Act, 2008",
"The Factories Act, 1948"
],
"Digital Personal Data Protection Act, 2023."
],
[
"ai-pred",
"As the forecast horizon gets longer, the forecast becomes:",
"Less reliable",
[
"More reliable",
"Exactly as reliable",
"Automatically seasonal"
],
"Looking too far ahead is one of the four limits."
],
[
"ai-pred",
"Which is a demand-forecasting question?",
"How many units will customers order in the festive season?",
[
"Which routes will see delays next week?",
"Which customers will respond to a campaign?",
"How much stock should each warehouse hold?"
],
"The others are delivery planning, marketing spend and inventory planning."
],
[
"ai-pred",
"The forecasting exercise's final output is:",
"A forecast table and a 3-line recommendation naming one limitation",
[
"A 20-page report",
"Only a chart",
"A trained neural network"
],
"Turn the forecast into a decision and state its limits."
],
[
"ai-pred",
"Before trusting Julius AI's forecast, the slides tell you to:",
"Check one number by hand",
[
"Ask it to sound more confident",
"Delete the outliers",
"Use a longer prompt"
],
"Verify before you trust."
]
],
"casesets": [],
"cases": [],
"short": [
[
"ai-sys",
"Differentiate between a system prompt and a user prompt on any five points. (5 marks)",
[
[
"Purpose: role/rules vs one task",
1,
"role|rules|task"
],
[
"When written: once before vs every turn",
1,
"once|every turn"
],
[
"Scope: whole conversation vs this request",
1,
"whole conversation|this request"
],
[
"Who writes: builder/teacher vs end user",
1,
"builder|teacher|end user"
],
[
"Controls tone/format/limits vs supplies topic/data; reused vs changes",
1,
"tone|format|reused|changes"
]
],
"BT2 · Understand"
],
[
"ai-sys",
"Explain the six parts of a reusable system prompt. (5 marks)",
[
[
"Role and purpose",
1,
"role"
],
[
"Audience",
1,
"audience"
],
[
"Method",
0.75,
"method"
],
[
"Rules (always/never)",
0.75,
"rules|always|never"
],
[
"Output format",
0.75,
"format"
],
[
"Uncertainty and limits",
0.75,
"uncertain|unsure|limits"
]
],
"BT2 · Understand"
],
[
"ai-sys",
"What does role prompting reliably change and what does it not change? Why is “specific beats generic” important? (5 marks)",
[
[
"Shapes tone, vocabulary, structure, perspective",
2,
"tone|vocabulary|structure|perspective"
],
[
"Does not improve factual accuracy; keep verifying",
1.5,
"accura|verify|fact"
],
[
"Specific role + audience + task gives focused answers, with an example",
1.5,
"specific|procurement|audience|task"
]
],
"BT2 · Understand"
],
[
"ai-sys",
"Write a system prompt for a BBA tutor using the reusable template. (5 marks)",
[
[
"Role, audience and purpose stated",
1.5,
"tutor|bba|student"
],
[
"Socratic method / hints before answers",
1,
"socratic|hint|one question"
],
[
"Rules incl. not writing graded work",
1,
"graded|never|always"
],
[
"Uncertainty instruction and format (short turns, check question)",
1.5,
"unsure|ask|format|check question"
]
],
"BT6 · Create"
],
[
"ai-sys",
"How should a system prompt be tested? Name the five test inputs. (5 marks)",
[
[
"Typical request",
1,
"typical"
],
[
"Vague request",
1,
"vague"
],
[
"Off-topic request",
1,
"off-topic|off topic"
],
[
"Edge case",
1,
"edge"
],
[
"Override attempt + keep versions v1, v2",
1,
"override|ignore|version"
]
],
"BT1 · Remember"
],
[
"ai-kb",
"Describe the three steps of building a personal knowledge base with AI and give the summary template. (5 marks)",
[
[
"Choose three sources of different types",
1.5,
"three sources|report|paper|forecast"
],
[
"Ask AI for a summary of each with the same template + comparison",
1.5,
"same template|compare"
],
[
"Check the AI's work against the original",
1,
"check|original"
],
[
"Template: purpose, main claims, key numbers, limits, open questions",
1,
"purpose|claims|limits|open questions"
]
],
"BT2 · Understand"
],
[
"ai-kb",
"Explain any five mistakes AI often makes when summarising sources, with an example of one. (5 marks)",
[
[
"Wrong cause / one cause only",
1,
"wrong cause|one cause"
],
[
"Missing details",
1,
"missing"
],
[
"Reversed idea",
1,
"reversed"
],
[
"Mixed-in ideas / old numbers",
1,
"mixed|old number"
],
[
"Example, e.g. $110 billion → $210 billion",
1,
"110|210|india|22|47"
]
],
"BT2 · Understand"
],
[
"ai-kb",
"What is the bullwhip effect? State its four causes. (5 marks)",
[
[
"Orders vary more than sales; distortion grows upstream",
1,
"orders vary|upstream|distort"
],
[
"Demand signal processing",
1,
"demand signal"
],
[
"Rationing game",
1,
"rationing"
],
[
"Order batching",
1,
"batch"
],
[
"Price variations",
1,
"price"
]
],
"BT1 · Remember"
],
[
"ai-pred",
"Distinguish between descriptive, diagnostic, predictive and prescriptive analytics with one example each. (5 marks)",
[
[
"Descriptive: what happened + example",
1.25,
"descriptive|what happened"
],
[
"Diagnostic: why + example",
1.25,
"diagnostic|why"
],
[
"Predictive: what will happen + example",
1.25,
"predictive|will happen"
],
[
"Prescriptive: what to do + example",
1.25,
"prescriptive|should"
]
],
"BT2 · Understand"
],
[
"ai-pred",
"Explain trend, seasonality and noise in sales data with Indian business examples. (5 marks)",
[
[
"Trend = long-run direction",
1.5,
"trend|long-run|long run"
],
[
"Seasonality = calendar pattern, e.g. Diwali/monsoon",
2,
"season|diwali|monsoon|festive"
],
[
"Noise = random, e.g. one-off bulk order, strike",
1.5,
"noise|random|strike|bulk"
]
],
"BT2 · Understand"
],
[
"ai-pred",
"Using Sales = 39.5 + 2.0 × month (₹ lakh), forecast months 13–15 and state two limitations of this forecast. (5 marks)",
[
[
"Month 13 ≈ 65.5",
1,
"65.5"
],
[
"Month 14 ≈ 67.5 (slides 67.4)",
1,
"67.5|67.4"
],
[
"Month 15 ≈ 69.5 (slides 69.4)",
1,
"69.5|69.4"
],
[
"Two limitations: small sample, seasonality, horizon, DPDP",
2,
"small sample|season|horizon|far ahead|dpdp"
]
],
"BT3 · Apply"
],
[
"ai-pred",
"Compare the no-code (Julius AI) and code-assisted (Google Colab) routes to a sales forecast. (5 marks)",
[
[
"Julius AI: natural-language prompts to plot, forecast, explain",
1.5,
"julius|prompt|no-code"
],
[
"Colab: pandas + scikit-learn LinearRegression; load, fit, predict",
2,
"colab|pandas|sklearn|linearregression|fit"
],
[
"Both should match; verify one number by hand / explain gaps",
1.5,
"same|match|verify|gap"
]
],
"BT4 · Analyse"
]
],
"longq": [
[
"ai-sys",
"What is a system prompt? Explain its anatomy and design a system prompt for a supply-chain advisor for a small manufacturer. Explain how you would test and improve it. (10 marks)",
[
[
"Definition and contrast with user prompt",
2,
"standing|user prompt|job description"
],
[
"Six-part anatomy explained",
2,
"role|audience|method|rules|format|uncertain"
],
[
"Complete advisor prompt using the template (clarifying questions, 2–3 options, assumptions, not professional advice)",
3,
"advisor|options|trade-off|assumption"
],
[
"Five test inputs",
2,
"typical|vague|off-topic|edge|override"
],
[
"Versioning and common mistakes avoided",
1,
"version|v1|mistake"
]
],
"BT6 · Create"
],
[
"ai-sys",
"Compare the tutor, advisor and research-assistant adaptations of a system prompt on role, method, key rules and output format. (10 marks)",
[
[
"Tutor: role + Socratic method",
2.5,
"tutor|socratic"
],
[
"Advisor: role + clarifying questions, 2–3 options",
2.5,
"advisor|clarify|options"
],
[
"Research assistant: facts vs inference, never invent sources",
2.5,
"research|invent|source|confidence"
],
[
"Formats compared and a concluding comparison",
2.5,
"format|summary|recommendation|check question"
]
],
"BT4 · Analyse"
],
[
"ai-kb",
"Explain how to build a personal knowledge base with AI. Using the bullwhip, LPI and chip-shortage examples, show how a student should check an AI summary for mistakes. (10 marks)",
[
[
"Three steps",
2,
"three|template|check"
],
[
"Summary template",
2,
"purpose|claims|limits"
],
[
"Six mistake types",
3,
"wrong cause|missing|reversed|mixed|old|one cause"
],
[
"Worked checks: $110B → $210B; India 22nd vs 47th; reversed bullwhip idea",
2,
"110|210|22|47|reversed"
],
[
"Conclusion: always read the original",
1,
"original"
]
],
"BT3 · Apply"
],
[
"ai-pred",
"What is predictive analytics? Explain the four types of analytics, the three patterns in sales data and how a regression trend line produces a forecast, using the 12-month sales example. (10 marks)",
[
[
"Definition: past data → pattern → likely outcome",
2,
"past|pattern|likely"
],
[
"Four types with examples",
2,
"descriptive|diagnostic|predictive|prescriptive"
],
[
"Trend, seasonality, noise",
2,
"trend|season|noise"
],
[
"Regression line Sales ≈ 39.5 + 2.0 × month; slope meaning",
2,
"39.5|2.0|slope"
],
[
"Forecasts ≈ 65.5, 67.4, 69.4 lakh",
2,
"65.5|67.4|69.4"
]
],
"BT3 · Apply"
],
[
"ai-pred",
"“A forecast supports a decision; it does not replace business judgement.” Discuss with reference to the limitations of predictive analytics and data protection in India. (10 marks)",
[
[
"Forecast = likely, not certain",
2,
"likely|certain"
],
[
"Small sample, seasonality missed, horizon",
3,
"sample|season|horizon|far"
],
[
"DPDP Act 2023 for customer data",
2,
"dpdp"
],
[
"Role of managerial judgement + example decision",
2,
"judgement|judgment|decision|stock"
],
[
"Balanced conclusion",
1,
"conclu"
]
],
"BT5 · Evaluate"
],
[
"ai-pred",
"Describe four business uses of prediction and explain the steps of the forecasting exercise in Julius AI and Google Colab. (10 marks)",
[
[
"Demand, inventory, delivery, marketing uses",
3,
"demand|inventory|delivery|marketing"
],
[
"Julius AI prompts and verification",
2.5,
"julius|prompt|verify"
],
[
"Colab steps: load, fit, predict",
2.5,
"load|fit|predict|pandas"
],
[
"Compare results and write a 3-line recommendation with a limitation",
2,
"compare|recommendation|limitation"
]
],
"BT3 · Apply"
]
],
"long": [
{
"id": "AI1",
"title": "KiranaKart: forecasting festive demand",
"topics": [
"ai-pred",
"ai-sys"
],
"text": "KiranaKart, a quick-commerce start-up in Chandigarh, recorded monthly sales (₹ lakh) for one year: 42, 44, 43, 47, 50, 52, 56, 55, 58, 60, 59, 64. The founder wants to know how much stock to order for the next three months, which include Diwali. A junior analyst fitted a straight trend line and forecast about ₹65–69 lakh. The founder also wants a chatbot that answers store managers' stock questions consistently, and plans to use customers' purchase histories to target offers.",
"parts": [
[
"Explain the analyst's method and evaluate whether the forecast is reliable enough for the Diwali stock decision.",
10,
[
[
"Trend line Sales ≈ 39.5 + 2.0 × month, slope ₹2 lakh/month",
2,
"39.5|2.0|slope|trend"
],
[
"Forecasts ≈ 65.5, 67.4, 69.4",
2,
"65.5|67.4|69.4"
],
[
"Seasonality missed: Diwali spike not in a straight line",
3,
"season|diwali|festive"
],
[
"Small sample, horizon; recommend extra buffer/judgement",
3,
"sample|buffer|judgement|judgment|horizon"
]
]
],
[
"Design a system prompt for the store managers' stock chatbot and explain how KiranaKart should handle customer data.",
10,
[
[
"Role, audience, purpose",
2,
"role|store manager|audience"
],
[
"Method and rules (state assumptions, flag high-stakes, say when unsure)",
3,
"assum|unsure|rule|never"
],
[
"Output format",
2,
"format|table|steps"
],
[
"DPDP Act 2023: consent, purpose limitation, protecting purchase histories",
3,
"dpdp|consent|personal data|privacy"
]
]
]
]
},
{
"id": "AI2",
"title": "SupplyWise: an AI research brief gone wrong",
"topics": [
"ai-kb",
"ai-sys"
],
"text": "SupplyWise, a logistics consultancy, asked an AI tool to summarise three sources for a client brief: the World Bank LPI 2023, the 1997 bullwhip paper by Lee, Padmanabhan and Whang, and AlixPartners' 2021 chip-shortage forecasts. The AI's brief said: “India is strong in logistics everywhere. Bullwhip happens because managers order badly. The chip shortage cost carmakers $110 billion in 2021.” The client is about to use the brief in a board meeting.",
"parts": [
[
"Identify each mistake in the AI's brief, name its type and give the correct statement.",
10,
[
[
"India: missing details, 22nd international shipments vs 47th infrastructure",
3,
"missing|22|47"
],
[
"Bullwhip: reversed idea; happens even when each firm orders sensibly; four causes",
4,
"reversed|sensibl|batch|rationing|price|signal"
],
[
"$110 billion: old number; revised to $210 billion in September",
3,
"old|210"
]
]
],
[
"Recommend a process and a research-assistant system prompt that would prevent such errors in future.",
10,
[
[
"Same summary template for every source",
2,
"template|purpose|claims"
],
[
"Human check of every number and cause against the original",
3,
"check|original|number"
],
[
"Research-assistant prompt: never invent, mark confidence, say not found, separate fact from inference",
3,
"invent|confidence|not found|inference"
],
[
"Test inputs and versions",
2,
"test|version"
]
]
]
]
}
],
"videos": [],
"cards": [
[
"ai-sys",
"System prompt",
"Standing instructions defining who the AI is, what it is for and how it behaves (a job description + SOP)."
],
[
"ai-sys",
"User prompt",
"The specific request in one turn (today's task from your manager)."
],
[
"ai-sys",
"Where to set system prompts",
"API system field · ChatGPT Custom Instructions/GPTs · Claude Projects · Gemini Gems."
],
[
"ai-sys",
"Role vs persona",
"Role = function; persona = voice and manner."
],
[
"ai-sys",
"Role prompting limits",
"Shapes tone and structure; does not improve factual accuracy."
],
[
"ai-sys",
"Six parts of a system prompt",
"Role & purpose, audience, method, rules, output format, uncertainty & limits."
],
[
"ai-sys",
"Five test inputs",
"Typical, vague, off-topic, edge case, override attempt."
],
[
"ai-kb",
"Knowledge base: 3 steps",
"Choose 3 different sources → same-template AI summaries → check against originals."
],
[
"ai-kb",
"Summary template",
"Purpose, main claims, key numbers & dates, limits, open questions."
],
[
"ai-kb",
"Bullwhip causes",
"Demand signal processing, rationing game, order batching, price variations."
],
[
"ai-kb",
"Six AI summary mistakes",
"Wrong cause, missing details, reversed idea, mixed-in ideas, old numbers, one cause only."
],
[
"ai-pred",
"Four types of analytics",
"Descriptive (what), diagnostic (why), predictive (what next), prescriptive (what to do)."
],
[
"ai-pred",
"Trend / seasonality / noise",
"Long-run direction / calendar pattern / random wobble."
],
[
"ai-pred",
"Regression forecast",
"Sales ≈ 39.5 + 2.0 × month → 65.5, 67.4, 69.4 lakh."
],
[
"ai-pred",
"Forecast limits",
"Small sample, seasonality missed, horizon too far, DPDP Act 2023 for personal data."
]
],
"revision": {
"u1": "<h3>Prompting</h3><ul><li>System = standing rules (job description) · User = one task</li><li>Set in: API system field, ChatGPT GPTs, Claude Projects, Gemini Gems</li><li>Anatomy: role · audience · method · rules · format · uncertainty</li><li>Role prompting shapes tone, not accuracy · specific beats generic</li><li>Test: typical, vague, off-topic, edge, override · keep versions</li></ul><h3>Knowledge base</h3><ul><li>3 sources → same template → check originals</li><li>Template: purpose, claims, numbers, limits, open questions</li><li>Mistakes: wrong cause, missing details, reversed, mixed-in, old numbers, one cause</li><li>Bullwhip: demand signal, rationing, batching, price</li></ul><h3>Predictive analytics</h3><ul><li>Descriptive → diagnostic → predictive → prescriptive</li><li>Trend, seasonality, noise · Sales ≈ 39.5 + 2.0 × month</li><li>Julius AI (no-code) vs Colab (pandas + sklearn)</li><li>Limits: small sample, seasonality, horizon, DPDP Act 2023</li></ul>"
},
"upcoming": "More AI & ML units will be added as new lectures are posted on CULMS."
};
