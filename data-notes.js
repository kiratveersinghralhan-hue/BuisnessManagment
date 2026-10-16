/* Notes written from Dr. Sulochna Syal's lecture slides (Lectures 1–23), Principles of Business & Management, CBS 2026-27 */
window.UNITS = [
  { id: 'u1', name: 'Unit 1', title: 'Nature of business & management', lectures: 'Lectures 1–6' },
  { id: 'u2', name: 'Unit 2', title: 'Business environment & strategy', lectures: 'Lectures 7–10' },
  { id: 'u3', name: 'Unit 3', title: 'Operations, finance, HR & marketing', lectures: 'Lectures 11–24' }
];

window.NOTES = [
/* ============================ UNIT 1 ============================ */
{
id: 'business', unit: 'u1', lec: 'L1', title: 'Business, organisation & forms of ownership',
sum: 'What a business is, why growth needs management, sole proprietorship vs partnership. Case: Healthy Bites.',
html: `
<h3>Business</h3>
<p>A business is an <b>organised economic activity</b> in which resources are combined to create and deliver products or services that give value to customers, usually in exchange for revenue, with the aim of creating sustainable value.</p>
<div class="flow">Identify a need → Provide goods/services → Create value → Exchange → Revenue → Profit / sustainability</div>
<p><b>Business = Problem solving + Value creation + Value capture.</b> A business exists because there is a problem, need or opportunity that someone is willing to pay to solve.</p>
<table><tr><th>Customer problem</th><th>Business</th><th>Value created</th></tr>
<tr><td>Need transportation</td><td>Uber / Ola</td><td>Convenient mobility</td></tr>
<tr><td>Need learning</td><td>Coursera</td><td>Accessible education</td></tr>
<tr><td>Need accommodation</td><td>Airbnb</td><td>Alternative stays</td></tr>
<tr><td>Need digital payments</td><td>PhonePe / GPay</td><td>Convenient transactions</td></tr>
<tr><td>Need entertainment</td><td>Netflix</td><td>On-demand entertainment</td></tr></table>
<p><b>Swiggy</b> doesn't make food. It connects customers, restaurants, delivery partners, technology and payments: <i>Customer need → Digital platform → Restaurant + delivery ecosystem → Customer experience → Revenue.</i></p>

<h3>Organisation and business organisation</h3>
<ul>
<li><b>Organisation:</b> a structured arrangement of people, resources, responsibilities and authority designed to achieve common objectives.</li>
<li><b>Business organisation:</b> a formal arrangement bringing together people, resources, capital and activities to achieve business objectives (profit, growth, customer satisfaction, innovation, social value).</li>
</ul>
<p>The <b>form of organisation decides</b>: who owns it, who controls/manages it, how profits are shared, who bears risk, how much capital can be raised, its legal status and its continuity. Compare forms on <b>ownership, control, liability, capital, decision-making and suitability</b>.</p>

<h3>Why growth creates the need for management</h3>
<p>Healthy Bites (Aarav & Meera): 4 employees, daily customers grew from 60 to ~250, then online orders. Problems: unclear responsibility, staff getting instructions from both founders (violates unity of command), no delivery planning, late/wrong orders, inconsistent quality.</p>
<p>Aarav: "Make everyone work harder." Meera: "We need better organisation and management." Meera is right. <b>The business grew faster than its management system.</b> Informal management works at 4 people; more customers → more staff → more orders → more complexity, so it needs <b>planning, organising, delegation, coordination, control and communication</b>. Her fixes (divide responsibilities, supervisors, standard procedures, training, order-tracking tech, feedback, targets) map directly to POLC.</p>

<h3>Sole proprietorship</h3>
<p>Owned and controlled by <b>one person</b> (small shop, salon, consultancy).</p>
<div class="two"><div><h4>Advantages</h4><ul><li>Simple to establish</li><li>Complete control, fast decisions</li><li>Direct customer relationship</li><li>Owner keeps entire profit</li></ul></div>
<div><h4>Limitations</h4><ul><li>Limited finance</li><li><b>Unlimited personal liability</b></li><li>Depends heavily on owner</li><li>Limited managerial expertise</li><li>Hard to expand at scale</li></ul></div></div>

<h3>Partnership</h3>
<p>Owned by <b>two or more persons</b> who agree to carry on a business and share profits (e.g., two friends starting a consultancy).</p>
<div class="two"><div><h4>Advantages</h4><ul><li>More capital than sole proprietor</li><li>Combined skills</li><li>Shared responsibilities</li><li>Easy to set up, better ability to expand</li></ul></div>
<div><h4>Limitations</h4><ul><li>Conflict between partners</li><li>Shared decisions can be slow</li><li>Profit must be shared</li><li>Liability can be significant</li><li>Continuity affected by partner changes</li></ul></div></div>
<p class="flow">Sole Proprietorship → Partnership → LLP → Company → Cooperative</p>
<div class="tip"><b>Case answer tip:</b> When a case asks "partnership, company or accept investor?", argue on capital needed, liability/risk, control (an investor taking 40% dilutes control), continuity and growth ambition. For pan-India expansion, a private limited company usually fits better than a partnership.</div>`
},
{
id: 'forms', unit: 'u1', lec: 'L2', title: 'LLP, company, OPC, cooperative & digital-era business',
sum: 'LLP Act 2008, Companies Act 2013, private vs public company, OPC, cooperatives (Amul), and how digital businesses create value.',
html: `
<h3>Limited Liability Partnership (LLP)</h3>
<p>A <b>hybrid</b>: flexibility of a partnership + limited liability and separate legal identity of a company. Governed by the <b>LLP Act, 2008</b>. Suited to <b>professional services</b>: consulting, law, accounting, design and tech firms, where partners contribute knowledge, skills, reputation and capital.</p>
<table><tr><th>Feature</th><th>Meaning</th></tr>
<tr><td>Limited liability</td><td>Partners' personal exposure generally protected</td></tr>
<tr><td>Separate legal identity</td><td>LLP is distinct from its partners</td></tr>
<tr><td>Flexibility</td><td>Internal management customised through the LLP agreement</td></tr>
<tr><td>Perpetual succession</td><td>Change in partners doesn't end the business</td></tr>
<tr><td>Less rigid than a company</td><td>More flexible governance</td></tr></table>
<p><b>Limitations:</b> fund-raising limits (not for large public fundraising), needs mutual trust, still has registration/filing/compliance obligations.</p>
<p><b>Example: AZB & Partners</b> (law firm). Value comes from expertise, reputation, specialist knowledge, client relationships, i.e. <b>intellectual capital</b>, so a form that lets partners participate is attractive. Risk of many partners: disagreements on profit sharing, strategic direction, client allocation, leadership, compensation, expansion. A careful LLP agreement and governance system is critical.</p>

<h3>Company</h3>
<p>An incorporated organisation with a <b>legal identity separate from its members</b>. Governed by the <b>Companies Act, 2013</b>; Section 3 covers public, private and One Person Companies. Shareholders own shares; the company owns assets, signs contracts and incurs liabilities; management runs it.</p>
<p><b>Why the company form exists:</b> raise <b>capital</b> from many investors, <b>continuity</b> when shareholders change, <b>limited liability</b> for shareholders, and <b>professional management</b> (ownership separated from management).</p>
<ul><li><b>Private company:</b> closely held, restrictions on share transfer. Used by startups, family businesses, tech companies.</li>
<li><b>Public company:</b> broad shareholder base; if listed, shares trade on a stock exchange. Ownership is dispersed, so <b>governance matters more</b>; managers must consider shareholders, employees, customers, government, regulators, society, investors.</li></ul>

<h3>One Person Company (OPC)</h3>
<p>Introduced by the Companies Act 2013: a <b>single person</b> can form a company with a separate legal identity. It sits between a sole proprietorship (easy, no separate identity) and a private limited company.</p>

<h3>Cooperative</h3>
<p>Individuals voluntarily come together to meet <b>common economic or social needs</b>; focus on <b>member benefit</b>, not investor profit maximisation. <b>Amul:</b> milk producers → cooperative → processing → distribution → consumers.</p>

<h3>Business in the digital era</h3>
<p>Traditional: physical assets + physical distribution + labour. Digital: <b>data + algorithms + platforms + networks + IP + technology</b>.</p>
<div class="flow">Data → Algorithms → Decisions → Customer experience → Transactions → More data</div>
<p>Amazon's advantage isn't just warehouses: data, cloud, algorithms, logistics, payments, reviews, recommendations and platform economics combined.</p>

<h3>Choosing a form depends on</h3>
<p>Legal requirements, continuity, size, tax, growth ambitions, capital needed, need for control, nature of business, risk, number of owners, need for external investment.</p>
<table><tr><th>Form</th><th>Owners</th><th>Liability</th><th>Legal identity</th><th>Best for</th></tr>
<tr><td>Sole proprietorship</td><td>1</td><td>Unlimited</td><td>No</td><td>Small local business</td></tr>
<tr><td>Partnership</td><td>2+</td><td>Significant</td><td>No</td><td>Small firms, shared skills</td></tr>
<tr><td>LLP</td><td>2+ partners</td><td>Limited</td><td>Yes</td><td>Professional services</td></tr>
<tr><td>OPC</td><td>1</td><td>Limited</td><td>Yes</td><td>Solo founder wanting company status</td></tr>
<tr><td>Private company</td><td>Shareholders</td><td>Limited</td><td>Yes</td><td>Startups, growing firms</td></tr>
<tr><td>Public company</td><td>Many shareholders</td><td>Limited</td><td>Yes</td><td>Large-scale capital raising</td></tr>
<tr><td>Cooperative</td><td>Members</td><td>Varies</td><td>Yes (registered)</td><td>Member welfare (Amul)</td></tr></table>`
},
{
id: 'polc', unit: 'u1', lec: 'L3, L5', title: 'Management & Fayol\'s functions (POLC)',
sum: 'Definition of management, efficiency vs effectiveness, Planning–Organising–Leading–Controlling, and the Desert Island activity.',
html: `
<h3>Management</h3>
<p>Management is the process of <b>planning, organising, leading and controlling</b> organisational resources and people to achieve objectives <b>effectively and efficiently</b> in a changing environment. Managers get things done <b>through other people</b>: they make decisions, allocate resources and direct others' activities.</p>
<p><b>Organisation</b> (for this definition): a consciously coordinated social unit of two or more people working on a relatively continuous basis to achieve common goals.</p>
<table><tr><th>Efficiency</th><th>Effectiveness</th></tr>
<tr><td><b>Doing things right</b>: fewer resources, less time</td><td><b>Doing the right things</b>: achieving the right goals</td></tr>
<tr><td>An AI firm builds software with less time and cost</td><td>It builds the AI product customers actually want</td></tr></table>
<div class="tip">"We built the world's fastest food-delivery algorithm, but customers don't want it" = <b>efficient but ineffective</b>: excellent execution, wrong strategy.</div>

<h3>Henri Fayol's management functions</h3>
<p>Fayol looked at management from the <b>manager's</b> perspective (Taylor looked at the worker). Classical: <b>Planning → Organising → Commanding → Coordinating → Controlling</b>. Modern simplification: <b>POLC</b>.</p>
<h4>Planning: "Where are we going and how will we get there?"</h4>
<p>AI company entering healthcare decides objective, customers, product, technology, resources, timeline, risks, competitors.</p>
<div class="flow">Objective → Strategy → Activities → Resources → Timeline → KPIs</div>
<h4>Organising: "Who will do it, with what resources, reporting to whom?"</h4>
<p>Division of work, allocation of resources, authority, responsibility, reporting relationships, coordination. E.g., CEO → Product Head → AI/ML, UX, Data, Sales teams.</p>
<h4>Leading</h4>
<p>Motivate, communicate, influence, coach, resolve conflicts, build teams, create commitment. "Where management becomes human."</p>
<h4>Controlling</h4>
<p>Not controlling people. <b>Comparing actual performance with desired performance and taking corrective action.</b></p>
<table><tr><th>KPI</th><th>Target</th><th>Actual</th></tr>
<tr><td>App uptime</td><td>99.9%</td><td>99.2%</td></tr><tr><td>Customer satisfaction</td><td>90%</td><td>82%</td></tr>
<tr><td>Product launch</td><td>6 months</td><td>8 months</td></tr><tr><td>Employee turnover</td><td>&lt;10%</td><td>18%</td></tr></table>
<div class="flow">Measure → Compare → Diagnose → Correct → Learn</div>

<h3>Desert Island Survival activity (L3)</h3>
<p>12 items, choose 5 in 15 minutes. It demonstrates the functions in action:</p>
<ul><li><b>Planning & prioritisation under scarcity:</b> did the team first decide a strategy ("seek rescue" vs "long-term survival")?</li>
<li><b>Organising:</b> allocating limited resources, coordinating the team</li>
<li><b>Leading:</b> communication, negotiation, consensus-building, conflict</li>
<li><b>Controlling:</b> reviewing decisions and outcomes, corrective action</li></ul>
<p>Choices reveal priorities and values (immediate needs like water vs long-term tools like knife/matches). "Management begins here."</p>
<div class="tip"><b>Case answer tip:</b> When a case shows chaos after growth, diagnose it by function. No targets = planning gap; unclear roles or two bosses = organising gap; low morale = leading gap; no tracking of delays = controlling gap.</div>`
},
{
id: 'mintz', unit: 'u1', lec: 'L5', title: 'Mintzberg\'s roles, managerial skills & Luthans',
sum: '10 managerial roles in 3 groups, Katz\'s technical/human/conceptual skills, Luthans\' successful vs effective managers.',
html: `
<h3>Mintzberg's managerial roles</h3>
<p>Late 1960s: Henry Mintzberg (MIT) observed five executives. <b>Fayol tells what managers should do; Mintzberg observed what managers actually do.</b> He found <b>10 interrelated roles in 3 groups</b>.</p>
<table><tr><th>Group</th><th>Role</th><th>What it looks like</th></tr>
<tr><td rowspan="3"><b>Interpersonal</b></td><td>Figurehead</td><td>Symbolic/ceremonial duties: cutting a ribbon, signing documents, greeting visitors</td></tr>
<tr><td>Leader</td><td>Motivating, hiring, training, directing staff</td></tr>
<tr><td>Liaison</td><td>Building a network of contacts outside the unit</td></tr>
<tr><td rowspan="3"><b>Informational</b></td><td>Monitor</td><td>Seeking and receiving information (reading reports, industry news)</td></tr>
<tr><td>Disseminator</td><td>Passing information to subordinates/insiders</td></tr>
<tr><td>Spokesperson</td><td>Representing the unit to outsiders (press, board, investors)</td></tr>
<tr><td rowspan="4"><b>Decisional</b></td><td>Entrepreneur</td><td>Spotting opportunities, starting improvement projects</td></tr>
<tr><td>Disturbance handler</td><td>Taking corrective action in crises (strike, supplier failure, outage)</td></tr>
<tr><td>Resource allocator</td><td>Deciding who gets what: budgets, people, time</td></tr>
<tr><td>Negotiator</td><td>Bargaining with unions, suppliers, partners</td></tr></table>
<div class="tip">Memory hook: <b>F-L-L / M-D-S / E-D-R-N</b>. In scenarios, look at the verb: "represents the company at a press conference" = spokesperson; "shares market report with the team" = disseminator; "handles a sudden server crash" = disturbance handler.</div>

<h3>Managerial skills (Katz)</h3>
<ul><li><b>Technical skills:</b> applying specialised knowledge (engineering, IT, accounting). Most important for lower-level managers.</li>
<li><b>Human skills:</b> understanding, communicating with, motivating and supporting people, individually and in groups. Important at all levels.</li>
<li><b>Conceptual skills:</b> analysing and diagnosing complex situations; seeing the organisation as a whole. Decision-making needs it: identify problem → develop alternatives → evaluate → choose the best. Most important for top managers.</li></ul>

<h3>Luthans' study of managerial activities</h3>
<table><tr><th>Activity</th><th>Includes</th></tr>
<tr><td>Traditional management</td><td>Decision making, planning, controlling</td></tr>
<tr><td>Communication</td><td>Exchanging routine information, paperwork</td></tr>
<tr><td>Human resource management</td><td>Motivating, disciplining, managing conflict, staffing, training</td></tr>
<tr><td>Networking</td><td>Socialising, politicking, interacting with outsiders</td></tr></table>
<p><b>Successful vs effective:</b> managers who got promoted faster (<b>successful</b>) spent most time on <b>networking</b>; managers who did their jobs well (<b>effective</b>) spent most time on <b>communication</b>. Successful ≠ effective.</p>`
},
{
id: 'evolution', unit: 'u1', lec: 'L4', title: 'Evolution of management thought',
sum: 'Scientific, administrative, bureaucratic → Human relations → Systems & contingency → TQM → Digital, agile, CSR.',
html: `
<p>Each era asked a different central question.</p>
<h3>Early industrial era: "How can we make work faster and more efficient?"</h3>
<ul><li><b>Scientific management (Taylor):</b> find the one best way. Shoe factory: divide work into small tasks, standardise the process, measure time, train workers, set performance standards.</li>
<li><b>Administrative theory (Fayol):</b> managing the whole organisation; management functions.</li>
<li><b>Bureaucratic theory (Weber):</b> rules, hierarchy, formal authority.</li></ul>
<h3>Late 1920s–1930s: Human relations movement</h3>
<p>Discovery: <b>employees are human beings, not machines.</b> Satisfaction, social interaction and emotional needs matter (Hawthorne studies).</p>
<p>Company A: good pay and tech but the manager never listens, no recognition, no cooperation. Company B: similar pay, manager listens, people recognised, good communication. B performs better. People's feelings, relationships and social environment influence behaviour.</p>
<h3>Mid-20th century: Systems theory</h3>
<p>The organisation is a <b>system of interconnected parts</b>: Technology → Operations → Marketing → Finance → Customer service. If tech fails, orders fail → customers unhappy → sales fall → complaints rise. Like the heart, brain and lungs. <b>You can't manage one department in isolation.</b></p>
<h3>Contingency approach: "It depends"</h3>
<p>No single best way. Startup with 8 people: informal communication, flexible roles, quick decisions. Bank with 10,000 employees: formal procedures, clear authority, documentation, controls, compliance. "What works here may not work there."</p>
<h3>1980s: Total Quality Management (TQM)</h3>
<p>"How can we continuously improve quality and satisfy customers?" Continuous improvement, customer satisfaction, employee involvement, quality control. Restaurant taking 30 minutes: TQM doesn't blame the waiter; it examines the whole process: order taking → kitchen → preparation → packaging → delivery.</p>
<h3>Modern era: digital transformation, agile, CSR</h3>
<p>New question: <b>"How can we continuously adapt and create value in a rapidly changing environment?"</b></p>
<ul><li><b>Digital transformation:</b> using digital tech to fundamentally improve how an organisation operates and creates value. Bank: Customer → Branch → Employee → Paperwork becomes Customer → App → Digital authentication → Automated transaction. Changes customer experience, processes, roles, decisions and business models.</li>
<li><b>Agile management:</b> respond quickly via iterative improvement. App hard to use? Identify → small change → test → feedback → improve → repeat (not a months-long redesign).</li>
<li><b>CSR:</b> Profit + People + Planet + Ethics. "How can we reduce pollution while staying profitable?" "How should we protect customer data?"</li></ul>
<table><tr><th>Era</th><th>Focus</th></tr>
<tr><td>Early industrial</td><td>Efficiency + standardisation</td></tr><tr><td>Human relations</td><td>People + relationships + satisfaction</td></tr>
<tr><td>Systems & contingency</td><td>Interdependence + situation</td></tr><tr><td>TQM</td><td>Quality + customer satisfaction</td></tr>
<tr><td>Modern</td><td>Digitalisation + agility + innovation + ethics + social responsibility</td></tr></table>`
},
{
id: 'hawthorne', unit: 'u1', lec: 'L6', title: 'Hawthorne studies',
sum: 'Four experiments at Western Electric (1924–1932), the Hawthorne effect, informal groups, Elton Mayo and the human relations approach.',
html: `
<p>Studies of worker productivity at Western Electric's Hawthorne (Cicero) plant, <b>1924–1932</b>, by the National Research Council, then Western Electric and Harvard (Elton Mayo).</p>
<table><tr><th>Experiment</th><th>Setup</th><th>Finding</th></tr>
<tr><td><b>Illumination</b> (1924–27)</td><td>Lighting raised and lowered; IV = light, DV = productivity</td><td>Productivity rose both when light increased <i>and</i> decreased. Lighting wasn't the cause; workers knew they were observed → <b>Hawthorne effect</b></td></tr>
<tr><td><b>Relay assembly test room</b> (1927–29)</td><td>5 women in a separate room; rest breaks, hours, incentives, refreshments changed</td><td>Output rose and <b>stayed high even when improvements were removed</b>. They felt important, got supervisor attention, friendly environment</td></tr>
<tr><td><b>Mica-splitting</b> (1928–30)</td><td>Piece-rate pay kept the same, conditions varied</td><td>Productivity up ~15%; <b>non-pay factors</b> (relationships, recognition, morale) drive performance</td></tr>
<tr><td><b>Interview programme</b> (1928–31)</td><td>~21,000 employees interviewed freely</td><td>People performed better when <b>supervisors listened</b>; work happens in a social context</td></tr>
<tr><td><b>Bank wiring observation room</b> (1931–32)</td><td>14 men offered incentive pay</td><td>No increase. The <b>informal group set a norm</b> for daily output and discouraged over-producers. <b>Social norms beat financial incentives</b></td></tr></table>
<div class="def"><b>Hawthorne effect:</b> people change their behaviour simply because they know they are being observed.</div>
<h3>Importance</h3>
<ul><li>Shifted management from Taylor's <b>engineering approach</b> to a <b>social-sciences approach</b> → Human Relations → Organisational Behaviour</li>
<li>Managers became leaders, motivators and communicators (Elton Mayo)</li>
<li>Highlighted relationships, informal groups, communication, recognition, participation and psychological needs: the base of modern motivation, leadership and engagement practices</li></ul>
<div class="tip"><b>One-line summary:</b> Taylor taught managers to improve the work. Fayol taught them to manage the organisation. Hawthorne reminded them organisations are made of people. Mintzberg showed what managers actually do. Today's manager integrates all of this with technology, uncertainty and ethics.</div>`
},

/* ============================ UNIT 2 ============================ */
{
id: 'env', unit: 'u2', lec: 'L7', title: 'Business environment & PESTEL',
sum: 'Features, internal vs micro vs macro, environmental scanning, PESTEL with IKEA India and Netflix India cases.',
html: `
<p><b>Business goals:</b> profit, power, employee satisfaction & development, quality products, market leadership, innovation, service to society.</p>
<h3>Business environment</h3>
<p>All internal and external factors that influence a business's functioning, performance, decisions and growth.</p>
<h4>Features</h4>
<ul><li><b>Dynamic:</b> keeps changing</li>
<li><b>Complex:</b> many interconnected factors (fuel cost → delivery cost → price → demand → profit)</li>
<li><b>Uncertain:</b> hard to predict</li>
<li><b>Interrelated:</b> tech → consumer behaviour → new business models → competition</li>
<li><b>Relative:</b> the same change affects firms differently (oil price rise hurts airlines, helps EV makers)</li></ul>
<h3>Types</h3>
<table><tr><th>Internal</th><th>External: Micro (task)</th><th>External: Macro (general)</th></tr>
<tr><td>Value system; vision, mission, objectives; management structure; internal power relationships; human resources; physical assets; R&D/tech capability; marketing resources; financial factors</td>
<td>Suppliers, customers, competitors, marketing intermediaries, financiers, publics</td>
<td>Technological, economic, political, natural, global, socio-cultural</td></tr></table>
<h3>Environmental scanning</h3>
<p>Systematically collecting, monitoring, analysing and interpreting information about the environment: the <b>"eyes and ears" of a business</b>. Helps identify opportunities and threats, understand customers, anticipate tech change, support planning, reduce uncertainty.</p>
<div class="flow">Scan → Analyse → Interpret → Act</div>
<p><b>Tools:</b> PESTEL (macro), Porter's Five Forces (industry), SWOT (internal + external), competitor analysis.</p>
<h3>PESTEL</h3>
<table><tr><th>Factor</th><th>Question</th><th>Examples</th></tr>
<tr><td><b>P</b>olitical</td><td>What is government doing?</td><td>Taxation, import/export policy, subsidies, stability, FDI rules, data localisation, app bans</td></tr>
<tr><td><b>E</b>conomic</td><td>What is happening in the economy?</td><td>Inflation, interest rates, GDP, unemployment, exchange rates, purchasing power, funding winter</td></tr>
<tr><td><b>S</b>ocial</td><td>How are people & lifestyles changing?</td><td>Demographics, urbanisation, health consciousness, Gen-Z short video, quick-commerce demand</td></tr>
<tr><td><b>T</b>echnological</td><td>What tech is changing business?</td><td>AI, GenAI, automation, cloud, IoT, 5G, digital payments, cybersecurity</td></tr>
<tr><td><b>E</b>nvironmental</td><td>Impact on nature and climate?</td><td>Climate change, pollution, waste, sustainable packaging, carbon, ESG/BRSR</td></tr>
<tr><td><b>L</b>egal</td><td>What laws must it follow?</td><td>Labour, consumer protection, competition, DPDP Act 2023, IT Rules 2021, IP, tax</td></tr></table>
<p>Political vs legal: <b>political = government policy and stance</b> (could change), <b>legal = laws already enacted</b> that must be complied with. Inflation example: raw material, transport and labour costs rise → price increase → lower purchasing power → lower demand.</p>
<h3>Case: IKEA in India</h3>
<p>Wanted to enter in the early 2000s, opened first store (Hyderabad) only in <b>2018</b>: a 12+ year delay.</p>
<ul><li><b>P:</b> FDI rule required single-brand retailers to source <b>30% locally</b>; IKEA had to restructure sourcing</li>
<li><b>E:</b> lower spending power → products from <b>₹199</b></li>
<li><b>S:</b> smaller homes, joint families, people hire carpenters → paid <b>assembly and home delivery</b>; studied 1,000+ homes; butter chicken and samosas in-store; re-shot ads</li>
<li><b>T:</b> smartphone growth → online ordering and app from day one</li>
<li><b>E:</b> sustainably sourced wood, environmental clearances; smaller city-store format</li>
<li><b>L:</b> labour, real-estate leasing and GST laws</li></ul>
<h3>Case: Netflix in India</h3>
<ul><li><b>P:</b> content self-regulation, pressure over sensitive content</li><li><b>E:</b> price-sensitive market → <b>₹149 mobile-only plan</b></li>
<li><b>S:</b> regional-language demand → Tamil/Telugu/Hindi originals; binge culture; competition with YouTube</li>
<li><b>T:</b> cheap data after Jio (2016), AI recommendations, adaptive bit-rate streaming</li>
<li><b>E:</b> data-centre energy scrutiny, net-zero targets</li><li><b>L:</b> IT Rules 2021, equalisation levy, DPDP Act 2023</li></ul>`
},
{
id: 'swot', unit: 'u2', lec: 'L8', title: 'SWOT & TOWS matrix (Kodak)',
sum: 'Internal strengths/weaknesses vs external opportunities/threats, converting SWOT into SO/WO/ST/WT strategies.',
html: `
<h3>Kodak: the cautionary case</h3>
<p>Founded 1888; "Kodak moment". Late 1980s: 145,000 employees, ~90% of US film market, 85% of camera sales. In <b>1975</b> Kodak engineer <b>Steven Sasson</b> built the first digital camera. Leadership: "That's cute, but don't tell anyone about it", fearing it would <b>cannibalise film</b> (70%+ of profits). Canon, Sony, Fujifilm invested in digital. Kodak filed for <b>bankruptcy in January 2012</b>.</p>
<h3>SWOT</h3>
<table><tr><th></th><th>Helpful</th><th>Harmful</th></tr>
<tr><td><b>Internal</b> (controllable)</td><td><b>Strengths:</b> what the firm does better than rivals</td><td><b>Weaknesses:</b> internal limitations/gaps</td></tr>
<tr><td><b>External</b> (environment)</td><td><b>Opportunities:</b> favourable trends to exploit</td><td><b>Threats:</b> external risks</td></tr></table>
<div class="tip">Trap: "Growing demand for EVs" is an <b>opportunity</b> (external), not a strength. "Our strong R&D team" is a <b>strength</b> (internal). Classify by <b>inside vs outside the company</b>.</div>
<h4>Kodak SWOT</h4>
<ul><li><b>S:</b> most trusted photo brand, global distribution, owned the digital camera patent, strong R&D</li>
<li><b>W:</b> 70%+ profit from film, slow risk-averse bureaucracy, incentives rewarded protecting film, leadership suppressed its own innovation</li>
<li><b>O:</b> emerging digital market, first-mover tech advantage, later camera phones and sensors</li>
<li><b>T:</b> rivals investing in digital, film becoming obsolete, consumers shifting to screen sharing</li></ul>
<h3>TOWS matrix: turning SWOT into action</h3>
<table><tr><th></th><th>Opportunities</th><th>Threats</th></tr>
<tr><td><b>Strengths</b></td><td><b>SO (maxi-maxi):</b> use strengths to capture opportunities</td><td><b>ST (maxi-mini):</b> use strengths to counter threats</td></tr>
<tr><td><b>Weaknesses</b></td><td><b>WO (mini-maxi):</b> use opportunities to fix weaknesses</td><td><b>WT (mini-mini):</b> defensive; reduce weaknesses, avoid threats</td></tr></table>
<ul><li><b>SO, Netflix:</b> strong recommendation tech + content library + growing regional-language demand → invest in regional content with personalised recommendations</li>
<li><b>WO, traditional clothing store:</b> no online presence (W) + e-commerce/social media boom (O) → online store, Instagram selling, digital payments, home delivery</li>
<li><b>ST, Amul:</b> strong brand, cooperative network, distribution (S) vs private dairy brands (T) → use brand and distribution to launch new products</li>
<li><b>WT, Kodak:</b> film dependence and slow culture (W) + digital threat (T) → reduce film dependence, invest aggressively in digital, redesign the model</li></ul>
<table><tr><th>Kodak</th><th>Strategy it should have used</th></tr>
<tr><td>SO</td><td>Use brand + R&D to lead digital imaging</td></tr><tr><td>WO</td><td>Use digital growth to shift away from film</td></tr>
<tr><td>ST</td><td>Use brand, distribution and tech to fight Sony, Canon, Fujifilm</td></tr><tr><td>WT</td><td>Restructure film business, accelerate digital transformation</td></tr></table>
<div class="def"><b>SWOT vs TOWS:</b> SWOT helps a manager <i>understand</i> the situation; TOWS helps <i>convert that understanding into strategic action</i>.</div>`
},
{
id: 'porter5', unit: 'u2', lec: 'L8', title: 'Porter\'s Five Forces',
sum: 'New entrants, supplier power, buyer power, substitutes and rivalry, and what makes an industry attractive.',
html: `
<p>Analyses the <b>industry (competitive) environment</b> to judge attractiveness and profitability.</p>
<table><tr><th>Force</th><th>Meaning</th><th>Strong when…</th></tr>
<tr><td><b>Threat of new entrants</b></td><td>How easily newcomers can enter and take share; a high threat caps prices</td><td>Low barriers: low capital, no economies of scale, weak brand loyalty, low switching costs, no network effects, easy distribution access, lax government policy</td></tr>
<tr><td><b>Bargaining power of suppliers</b></td><td>Suppliers' control over your prices, quality, terms</td><td>Few/unique suppliers, high switching cost, supplier can forward-integrate</td></tr>
<tr><td><b>Bargaining power of buyers</b></td><td>Customers' power to push prices down, demand more</td><td>Few big buyers, price-sensitive, many alternatives, low switching cost, large orders</td></tr>
<tr><td><b>Threat of substitutes</b></td><td>Customers meeting the <i>same need</i> with a different product, often from <i>another industry</i></td><td>Cheap, functionally similar substitutes with low switching cost</td></tr>
<tr><td><b>Competitive rivalry</b></td><td>Intensity of the fight among existing firms; usually the <b>biggest single determinant</b>, the other four feed into it</td><td>Many similar-size rivals, slow growth, high exit barriers, low differentiation</td></tr></table>
<div class="tip">Substitute vs competitor: Ola vs Uber = <b>rivalry</b> (same industry). Metro rail vs Ola, or video calls vs business travel = <b>substitute</b> (different product, same need).</div>
<h3>Barriers to entry (from the slides)</h3>
<p>Supply-side economies of scale, network effects, switching costs, capital requirements, unfair/incumbent advantage, unequal access to distribution channels, government policies.</p>
<h3>Why use the model</h3>
<ul><li>Shows how profits are distributed among the five forces</li><li>Reveals industry structure and who sets the rules</li>
<li>Baseline to assess a firm's strengths/weaknesses vs the industry</li><li>Complete industry overview</li><li>Encourages holistic strategic thinking; reveals investment opportunities</li></ul>
<p><b>Rule:</b> the stronger the forces, the <b>less attractive/profitable</b> the industry.</p>`
},
{
id: 'strategy', unit: 'u2', lec: 'L9', title: 'Strategy, vision–mission–values & levels of strategy',
sum: 'What strategy is (Porter), vision vs mission vs values (Tesla), corporate/business/functional levels, expansion via concentration and integration.',
html: `
<p>"If two companies have the same technology, customers and finances, why does one succeed and the other fail?" Strategy.</p>
<h3>Strategy</h3>
<p>A set of choices about <b>where</b> a business will compete, <b>how</b> it will create value and <b>how</b> it will build advantage. Questions: which customers, what problem, how tech creates value, how to differentiate, what capabilities, which markets, <b>what NOT to do</b>, how to earn money.</p>
<p><b>Porter:</b> strategy is the creation of a <b>unique and valuable position</b> through a set of activities different from rivals'.</p>
<div class="flow">Where are we now? → Where do we want to go? → How will we get there? → What resources? → How will we know we're succeeding?</div>
<p>Benefits: clear direction, better positioning, customer understanding, competitive strategy, resource use, capabilities, faster decisions.</p>
<h3>Vision, mission, values</h3>
<table><tr><th></th><th>Question</th><th>Tesla example</th></tr>
<tr><td><b>Vision</b> = destination (future)</td><td>Where do we want to go?</td><td>A sustainable energy future</td></tr>
<tr><td><b>Mission</b> = journey/purpose (present)</td><td>What do we do, for whom, why?</td><td>"To accelerate the world's transition to sustainable energy" (broader than "we make electric cars")</td></tr>
<tr><td><b>Values</b> = rules for the journey</td><td>How will we behave?</td><td>Innovation, responsibility, safety</td></tr></table>
<p>Chitkara's vision: "To positively engage and capacitate our stakeholders for learning, creating intellectual heritage, promoting entrepreneurship and community collaborations…". Vision guides employees (direction), managers (choices), investors (ambition), customers (purpose).</p>
<div class="tip"><b>Values mismatch:</b> "Customer satisfaction is our priority" but staff are rewarded only for sales volume. Stated values must shape recruitment, incentives, leadership, product decisions, service and governance. Spot this in cases.</div>
<h3>Levels of strategy</h3>
<table><tr><th>Level</th><th>Question</th><th>Who</th></tr>
<tr><td><b>Corporate</b></td><td>Where should the corporation compete? Which businesses?</td><td>Top management</td></tr>
<tr><td><b>Business</b></td><td>How should we compete in this business?</td><td>SBU / business heads</td></tr>
<tr><td><b>Functional</b></td><td>How should each department support the business strategy?</td><td>Functional heads</td></tr></table>
<p><b>Tata Group</b> deciding where to invest ₹1,000 crore across Motors, Electronics, Consumer, Steel, Digital = <b>corporate</b>. Tata Motors deciding how to beat Hyundai and Mahindra in EVs = <b>business</b>.</p>
<table><tr><th>Corporate level</th><th>Business level</th></tr>
<tr><td>Where to compete? Which businesses to own?</td><td>How to compete? How does this business win?</td></tr>
<tr><td>Allocate resources between businesses</td><td>Build competitive advantage</td></tr>
<tr><td>Diversification, acquisition/divestment</td><td>Cost leadership/differentiation/focus, pricing, positioning</td></tr></table>
<h3>Corporate-level alternatives</h3>
<p><b>1. Expansion  2. Stability  3. Retrenchment  4. Combination</b></p>
<h4>Expansion: "Let's grow"</h4>
<p>Substantially broaden scope via concentration, integration, diversification, M&A, international expansion. <b>Reliance:</b> petroleum → telecom → retail → digital → new energy.</p>
<p><b>Concentration:</b> put more resources into existing business(es) rather than new industries. Smartphone maker: "We will become the strongest smartphone company" and invests in R&D, distribution, marketing, manufacturing.</p>
<h4>Integration: moving along the value chain</h4>
<table><tr><th>Backward integration</th><th>Forward integration</th></tr>
<tr><td>Move toward <b>suppliers</b></td><td>Move toward <b>customers</b></td></tr>
<tr><td>Make components in-house (Tata Motors making a part it used to buy)</td><td>Open own retail stores / sell on own website</td></tr>
<tr><td>Why: reduce supplier dependence, control quality, cut input costs, regular supply</td><td>Why: closer to customers, control experience, higher margins, control pricing/branding, direct feedback</td></tr></table>
<div class="tip">Memory: <b>Backward = Supplier, Forward = Customer.</b></div>`
},
{
id: 'generic', unit: 'u2', lec: 'L10', title: 'Diversification, stability, retrenchment & generic strategies',
sum: 'Related vs unrelated diversification, turnaround/divestment/liquidation, combination, cost leadership, differentiation, focus, strategic positioning.',
html: `
<h3>Diversification: "Enter another business"</h3>
<ul><li><b>Related:</b> new business connected to existing tech, customers, brand or knowledge (tech company → cloud → AI → cybersecurity). Creates <b>synergy</b>.</li>
<li><b>Unrelated:</b> no operational connection (steel + hotels + IT + consumer products). The parent manages a portfolio and allocates capital.</li></ul>
<h3>Stability: "Maintain and improve gradually"</h3>
<p>When the firm has a strong position, healthy profits and stable customers, it may consolidate rather than take risks. Forms: <b>no-change, profit, pause/proceed-with-caution</b>.</p>
<h3>Retrenchment: "Let's reduce"</h3>
<table><tr><th>Type</th><th>Meaning</th><th>Memory</th></tr>
<tr><td><b>Turnaround</b></td><td>Business doing badly; fix it: cut costs, change management, restructure, improve products, focus on profitable customers</td><td>Fix it</td></tr>
<tr><td><b>Divestment</b></td><td>Sell a division that is loss-making, non-core or draining management attention</td><td>Sell it</td></tr>
<tr><td><b>Liquidation</b></td><td>Can't be saved; close and sell assets (most extreme)</td><td>Close it</td></tr></table>
<h3>Combination</h3>
<p>Most realistic for large groups: different strategies for different businesses at once. EV business → expansion; mature → stability; loss-making → turnaround; non-core → divestment.</p>
<div class="def"><b>Corporate strategy = Portfolio + Resources + Direction</b> (which businesses, where money goes, expand/maintain/reduce/combine).</div>
<h3>Business-level strategy</h3>
<p>"How will this business compete successfully?" <b>WHO → WHAT → HOW</b>. Netflix: WHO = people wanting home entertainment; WHAT = video streaming; HOW = convenient streaming, personalised recommendations, large library.</p>
<h3>Porter's generic strategies</h3>
<p>Two sources of advantage (<b>lower cost</b> or <b>differentiation</b>) × scope (<b>broad</b> or <b>narrow</b>).</p>
<table><tr><th></th><th>Lower cost</th><th>Differentiation</th></tr>
<tr><td><b>Broad target</b></td><td>Cost leadership</td><td>Differentiation</td></tr>
<tr><td><b>Narrow target</b></td><td>Cost focus</td><td>Differentiation focus</td></tr></table>
<ul><li><b>Cost leadership:</b> lowest-cost producer; charge lower prices or earn higher margins. <b>Walmart</b> (bulk buying, efficient supply chain, high volume), <b>IndiGo</b> (efficiency, standardisation). Coffee Shop A: affordable, fast, standardised, high volume.</li>
<li><b>Differentiation:</b> something customers see as unique and valuable (quality, design, tech, brand, service, features, reliability, experience) → premium price. <b>Apple</b>: design, brand, ecosystem, UX. Coffee Shop B: premium beans, ambience, personal service.</li>
<li><b>Focus:</b> serve a particular segment/niche extremely well. <b>Cost focus</b> = niche at low cost; <b>differentiation focus</b> = niche with specialised value.</li></ul>
<h3>Functional strategy</h3>
<p>Supports business strategy in each area: marketing, finance, HR, operations, R&D/technology, information/digital.</p>
<h3>Strategic positioning (Porter)</h3>
<p>Strategy is <b>not operational effectiveness</b> (doing the same things better/faster); it is performing <b>different</b> activities, or similar ones differently, to deliver a unique mix of value.</p>
<table><tr><th>Basis</th><th>Focus</th><th>Example</th></tr>
<tr><td><b>Variety-based</b></td><td><b>WHAT</b> is offered: a specific set of products</td><td>McDonald's: only burgers, fries, beverages, desserts, chicken</td></tr>
<tr><td><b>Needs-based</b></td><td><b>WHO</b> is served and most of their needs</td><td>Luxury hotel: rooms, fine dining, spa, business facilities for high-income travellers</td></tr>
<tr><td><b>Access-based</b></td><td><b>HOW</b> customers are reached (geography, size, channel)</td><td>Rural financial services: mobile banking, local agents, small-ticket products, regional language</td></tr></table>`
},
{
id: 'rbv', unit: 'u2', lec: 'L10', title: 'Resource-Based View, VRIO & Blue Ocean',
sum: 'Internal resources and capabilities (Barney), the VRIO test with Apple, red vs blue ocean strategy.',
html: `
<h3>Resource-Based View (RBV)</h3>
<p>Porter looks <b>outward</b> (industry, positioning). RBV, popularised by <b>Jay Barney</b>, looks <b>inward</b>: competitive advantage comes from internal <b>resources</b> (what the company <i>has</i>) and <b>capabilities</b> (what it <i>can do</i> with them).</p>
<table><tr><th>Tangible resources</th><th>Intangible resources</th><th>Human resources</th></tr>
<tr><td>Buildings, cash, factories, machines, technology infrastructure, distribution centres</td><td>Data, patents, brand reputation, culture, IP, customer relationships</td><td>Employee expertise, knowledge, leadership, creativity, technical & managerial skills, talent</td></tr></table>
<h3>VRIO framework</h3>
<table><tr><th>Test</th><th>Question</th><th>If it fails here…</th></tr>
<tr><td><b>V</b>aluable</td><td>Does it exploit opportunities / neutralise threats?</td><td>Competitive disadvantage</td></tr>
<tr><td><b>R</b>are</td><td>Do few competitors have it?</td><td>Competitive parity</td></tr>
<tr><td><b>I</b>nimitable</td><td>Is it costly to copy?</td><td>Temporary advantage</td></tr>
<tr><td><b>O</b>rganised</td><td>Is the firm set up to exploit it?</td><td>Unused advantage</td></tr></table>
<p>Pass all four → <b>sustained competitive advantage</b>.</p>
<p><b>Apple:</b> V: hardware-software integration creates switching costs, premium prices, services revenue. R: few firms design their own chips, hardware and OS. I: decades of developer tools, App Store, patents and sync are impossible to copy overnight. O: teams organised around functional capabilities with tight control over design, software and marketing.</p>
<p><b>You as a BBA grad:</b> digital marketing skills are valuable; if thousands have the same certificate, that's only parity. Combine your degree with Python data-scraping skills and a live client portfolio → rare and hard to copy.</p>
<table><tr><th>Strategic positioning</th><th>RBV</th></tr>
<tr><td>External orientation: market & competition</td><td>Internal orientation: resources & capabilities</td></tr>
<tr><td>Where/how should we compete?</td><td>What can we use to compete?</td></tr><tr><td>Porter</td><td>Barney</td></tr></table>
<h3>Red ocean vs blue ocean (Kim & Mauborgne)</h3>
<p><b>Red ocean:</b> existing markets where firms fight over the same customers, products, features, ads and prices; the water turns "red".</p>
<p><b>Blue ocean:</b> "Can we create a <b>new market space</b> instead of fighting?" Pursues <b>differentiation and low cost simultaneously</b> (value innovation) to create new demand and make competition irrelevant.</p>
<table><tr><th>Red ocean</th><th>Blue ocean</th></tr>
<tr><td>Compete in existing market space</td><td>Create uncontested market space</td></tr><tr><td>Beat the competition</td><td>Make competition irrelevant</td></tr>
<tr><td>Exploit existing demand</td><td>Create and capture new demand</td></tr><tr><td>Choose value–cost trade-off</td><td>Break the value–cost trade-off</td></tr>
<tr><td>Pros: established demand, predictability, brand recognition. Cons: intense competition, commoditisation, margin squeeze, saturation</td><td>Pros: new demand, innovation, high profit potential. Cons: imitation risk, high initial investment, uncertain adoption, execution risk</td></tr></table>`
},

/* ============================ UNIT 3 ============================ */
{
id: 'ops', unit: 'u3', lec: 'L11', title: 'Operations management, productivity & process types',
sum: 'Input–transformation–output, process vs operation, productivity formulas, volume–variety and the five process types.',
html: `
<h3>Operations management</h3>
<p>The systematic <b>design, direction and control of processes that transform inputs into products and services</b> for internal and external customers. It is process- and supply-chain-oriented, not just "production". It exists in banks, hospitals, universities, restaurants, airlines, e-commerce, fintech, consulting and government.</p>
<p>Key questions: what to produce/deliver, how, how much capacity, how to maintain quality, how to maximise customer value with available resources.</p>
<p><b>Production management</b> = traditionally manufacturing only. <b>Operations management</b> = manufacturing + services.</p>
<div class="flow">Suppliers → Inputs → Transformation process → Outputs → Customers (with feedback → process improvement)</div>
<ul><li><b>Inputs:</b> materials, labour, information, technology, capital, <b>time</b></li>
<li><b>Transformation:</b> converting inputs into something of greater value. Restaurant: vegetables + chef + kitchen + recipe → cooking → meal. Fintech: customer & transaction data + algorithms → AI risk assessment → credit decision / fraud alert</li></ul>
<table><tr><th>Process</th><th>Operation</th></tr>
<tr><td>An activity or group of activities that transforms inputs into outputs</td><td>A group of resources performing all or part of one or more processes</td></tr>
<tr><td>Amazon: customer order fulfilment</td><td>Order processing, picking, packing, transport, delivery, customer service</td></tr></table>
<p>Purpose: <b>create value</b>. A ₹60,000 laptop buyer pays for functionality, reliability, speed, convenience, design, service, availability, not plastic and chips.</p>
<h3>Productivity</h3>
<div class="formula">Productivity = Output ÷ Input</div>
<ul><li>Labour productivity = Output ÷ Labour hours</li><li>Machine productivity = Output ÷ Machine hours</li>
<li>Material productivity = Output ÷ Material input</li><li><b>Multifactor productivity</b> = Output ÷ (Labour + Capital + Materials + Energy + Other)</li></ul>
<table><tr><th>Productivity</th><th>Efficiency</th><th>Effectiveness</th></tr>
<tr><td>How much output per input</td><td>How well resources are used vs a standard</td><td>Achieving the right objectives</td></tr></table>
<p>1,000 food orders/hour is highly productive, but if customers get the wrong food, it's <b>ineffective</b>. RPA example: 10 people/1,000 invoices → 4 people/2,000 invoices = big productivity gain, but consider accuracy, employee impact, cybersecurity, CX and cost.</p>
<h3>Process types and the volume–variety relationship</h3>
<p>Low volume + high variety needs flexibility, skilled staff, general-purpose resources. High volume + low variety needs standardisation, automation, specialised resources.</p>
<table><tr><th>Process</th><th>Volume</th><th>Variety</th><th>Flexibility</th><th>Example</th></tr>
<tr><td><b>Project</b></td><td>Very low</td><td>Very high</td><td>Very high</td><td>Bridge, movie, ERP implementation</td></tr>
<tr><td><b>Job</b></td><td>Low</td><td>High</td><td>High</td><td>Custom furniture, legal consulting, specialised repair</td></tr>
<tr><td><b>Batch</b></td><td>Medium</td><td>Medium</td><td>Medium</td><td>Bakery: 500 chocolate, then 500 vanilla cakes</td></tr>
<tr><td><b>Line</b></td><td>High</td><td>Low</td><td>Low/medium</td><td>Car or smartphone assembly</td></tr>
<tr><td><b>Continuous</b></td><td>Very high</td><td>Very low</td><td>Very low</td><td>Oil refining, cement, electricity, steel</td></tr></table>
<p>Project: unique output, long duration, <b>resources move to the project</b>. Digital: software consulting = job/project; SaaS = repetitive/standardised; cloud = highly automated, scalable; AI model training = batch processing.</p>`
},
{
id: 'scm', unit: 'u3', lec: 'L12', title: 'Supply chain, quality & operations strategy',
sum: 'Supply-chain structure and three flows, bullwhip effect, quality and its costs, competitive priorities, operations–strategy linkage.',
html: `
<h3>Supply chain</h3>
<p>The network of interconnected processes and organisations that produce and deliver products/services: <b>suppliers → manufacturer/service provider → distributor → retailer/platform → customer</b>. SCM covers sourcing, design, production, warehousing, shipping and distribution to improve efficiency, quality, productivity and satisfaction. <b>Supply chain ≠ only logistics</b>: it coordinates suppliers, purchasing, production, inventory, information, logistics, distribution and customers.</p>
<table><tr><th>Flow</th><th>Direction</th></tr>
<tr><td>Material / product</td><td>Supplier → Customer</td></tr><tr><td>Information</td><td>Customer → Organisation → Supplier (both ways)</td></tr>
<tr><td>Financial</td><td>Customer → Organisation → Suppliers</td></tr></table>
<p>Digital supply chains rely on data, real-time tracking, cloud platforms and AI forecasting.</p>
<p><b>E-commerce order:</b> customer orders → platform receives → warehouse picks → packs → courier assigned → transported → delivered → rating/return.</p>
<h3>Why it matters: resilience</h3>
<p>Risks: supplier failure, geopolitics, transport delays, shortages, demand swings, cyberattacks, natural disasters, regulatory change. Great products still fail with weak supply chains.</p>
<h3>Bullwhip effect</h3>
<p>A small change in customer demand creates <b>progressively larger fluctuations upstream</b>: customer +5% → retailer orders +10% → distributor +20% → manufacturer +30% → supplier +40%. Fix: <b>information sharing</b>, real-time demand data, digital tech.</p>
<h3>Quality</h3>
<p>Consistently <b>meeting or exceeding customer requirements</b>, not just "no defects": performance, reliability, consistency, durability, responsiveness, accuracy, convenience, service experience. For online banking: availability, accuracy, speed, security, easy navigation, low downtime, responsive support. Quality is defined by what the <b>customer experiences</b>.</p>
<p><b>Quality is everyone's responsibility</b>: top management, operations, employees, suppliers, IT, marketing, finance, customers.</p>
<table><tr><th>Internal failure</th><th>External failure</th></tr>
<tr><td>Defect found <b>before</b> reaching customer: rework, scrap</td><td>Found <b>after</b> reaching customer: refunds, warranty claims, complaints, returns, <b>reputational damage</b></td></tr></table>
<p>Poor quality is far more expensive than quality.</p>
<h3>Continuous improvement</h3>
<p>"Can we perform this process better?" Reduce waiting, remove unnecessary steps, reduce defects, automate repetitive work, improve layout, skills, supplier coordination, use analytics.</p>
<h3>Operations strategy</h3>
<p>The long-term pattern of decisions by which an organisation designs and manages processes and resources to support its competitive objectives; how operations <b>implements corporate strategy</b>.</p>
<div class="flow">Corporate strategy → Market requirements → Operations strategy (processes + resources + technology) → Competitive advantage</div>
<h4>Competitive priorities</h4>
<p><b>Cost</b> (competitive prices?), <b>Quality</b> (consistently meet expectations?), <b>Time</b> (deliver quickly?), <b>Dependability</b> (deliver as promised?), <b>Flexibility</b> (respond to changing needs?), <b>Innovation</b> (new products/processes?).</p>
<table><tr><th>Poor linkage</th><th>Strong linkage</th></tr>
<tr><td>Marketing promises same-day delivery; operations lacks inventory and delivery capacity → dissatisfied customers</td><td>Marketing promises same-day; operations provides local inventory, fulfilment centres, delivery capacity, real-time tracking → alignment</td></tr></table>
<p><b>AI era:</b> traditional = people + machines + materials; modern = people + tech + data + AI + platforms + suppliers. AI supports forecasting, predictive maintenance, inventory optimisation, quality inspection, scheduling, route optimisation, customer service, fraud detection.</p>`
},
{
id: 'accounting', unit: 'u3', lec: 'L13', title: 'Accounting fundamentals & final accounts',
sum: 'Accounting as art and science, financial vs management accounting, GAAP, concepts and conventions, golden rules, journal, ledger, trial balance, trading/P&L/balance sheet.',
html: `
<h3>Accounting</h3>
<p>The process of <b>identifying, measuring, recording and communicating</b> economic transactions. It is an <b>art</b> (systematic knowledge, practice) and a <b>science</b> (specified rules).</p>
<p><b>Functions:</b> systematic records, calculate profit/loss, show financial position, inform various parties, support rational decisions.</p>
<table><tr><th>Financial accounting</th><th>Management accounting</th></tr>
<tr><td>Records and classifies transactions, prepares summaries to find annual profit/loss and financial position; communicates to outsiders</td><td>Presents accounting information to help <b>management</b> make policy and run daily operations: planning, control, organising, decisions, motivating, reporting</td></tr></table>
<p><b>GAAP:</b> rules derived from experience and practice; accepted based on <b>relevance, objectivity, feasibility</b>.</p>
<h3>Concepts</h3>
<ul><li><b>Business entity:</b> business is separate from owner</li><li><b>Going concern:</b> business will continue indefinitely</li>
<li><b>Money measurement:</b> only transactions measurable in money are recorded</li><li><b>Dual aspect:</b> every transaction has two effects</li>
<li><b>Accounting period:</b> results measured for a fixed period</li></ul>
<h3>Conventions</h3>
<p><b>Conservatism</b> (anticipate no profit, provide for all losses), <b>Consistency</b> (same methods year to year), <b>Disclosure</b> (reveal all material information).</p>
<h3>Accounting equation</h3>
<div class="formula">Assets = Liabilities + Capital (Owner's equity)</div>
<p>"For every debit there is a credit." What we own = what we owe + owner's investment.</p>
<h3>Golden rules</h3>
<table><tr><th>Account</th><th>Debit</th><th>Credit</th></tr>
<tr><td>Personal</td><td>The receiver</td><td>The giver</td></tr><tr><td>Real</td><td>What comes in</td><td>What goes out</td></tr>
<tr><td>Nominal</td><td>All expenses & losses</td><td>All incomes & gains</td></tr></table>
<h3>Journal → Ledger → Trial balance</h3>
<ul><li><b>Journal:</b> book of original entry; records transactions <b>chronologically</b>, splitting each into debit and credit (journalising). E.g., business started with cash ₹5,00,000: <i>Cash A/c Dr. To Capital A/c</i>. Rent paid ₹1,000: <i>Rent A/c Dr. To Cash A/c</i>.</li>
<li><b>Ledger:</b> principal book; classified, summarised record per account (posting from journal). In the slide example, Cash A/c balance c/d = ₹4,98,000.</li>
<li><b>Trial balance:</b> statement of all ledger balances on a date; total debits = total credits; checks <b>arithmetical accuracy</b> (doesn't catch all errors).</li></ul>
<h3>Final accounts</h3>
<table><tr><th>Statement</th><th>Shows</th><th>Contains</th></tr>
<tr><td><b>Trading account</b></td><td>Gross profit / gross loss</td><td>Opening stock, purchases, <b>direct expenses</b> (wages, carriage inward, freight, customs duty, motive power, royalty), sales, closing stock</td></tr>
<tr><td><b>Profit & loss account</b></td><td>Net profit / net loss</td><td>Gross profit + <b>indirect</b> incomes − <b>indirect expenses</b> (office & admin, selling & distribution, financial charges)</td></tr>
<tr><td><b>Balance sheet</b></td><td>Financial position <b>on a specific date</b></td><td>Assets and liabilities (a statement, not an account)</td></tr></table>
<p><b>Balance sheet order:</b> permanency order (most permanent first) or liquidity order (most liquid first). <b>Horizontal</b> = assets and financing side by side (entity approach). <b>Vertical</b> = liabilities deducted from assets, equity as residual (proprietary approach). Assets: fixed (tangible, intangible like patents/brands, investments) and current (inventory, receivables, cash).</p>`
},
{
id: 'fsa', unit: 'u3', lec: 'L14', title: 'Financial statement analysis & cash flow',
sum: 'Users, vertical (common-size) and horizontal (trend) analysis, cash flow statement under AS 3: operating, investing, financing.',
html: `
<p><b>Financial statement analysis</b> reviews the income statement, balance sheet and cash flow statement to make better economic decisions. <b>Users:</b> investors, creditors, regulators, company management.</p>
<p><b>Tools:</b> vertical (common-size) analysis, horizontal (trend) analysis, ratio analysis, cash flow analysis.</p>
<h3>Vertical / common-size analysis</h3>
<p>Each line item as a <b>% of a base</b> for a single year. Base: <b>total assets</b> (= total liabilities + equity) for the balance sheet; <b>net sales/revenue</b> for the income statement. Comparing years shows changes in asset/liability mix and spending; also used for gross, operating and net margins and comparing capital structure with rivals.</p>
<h3>Horizontal / trend analysis</h3>
<div class="formula">% change = (Later year − Earlier year) ÷ Earlier year × 100</div>
<p>Negative difference = decrease. Covers two or more years.</p>
<h3>Cash flow statement (AS 3)</h3>
<p>Shows inflows and outflows of cash; assesses ability to generate cash, needs for cash, <b>liquidity and solvency</b>. Applies to enterprises with turnover &gt; ₹50 crore and listed companies (listed companies use the <b>indirect method</b>).</p>
<ul><li><b>Cash:</b> cash in hand + demand deposits. <b>Cash equivalents:</b> short-term, highly liquid investments with insignificant risk of value change.</li></ul>
<table><tr><th>Activity</th><th>Meaning</th><th>Inflows</th><th>Outflows</th></tr>
<tr><td><b>Operating</b></td><td>Principal revenue-producing activities</td><td>Receipts from sale of goods/services, royalties, fees, commissions</td><td>Payments to suppliers and employees, income tax</td></tr>
<tr><td><b>Investing</b></td><td>Acquisition/disposal of long-term assets & investments</td><td>Sale of fixed assets/investments, interest & dividend received</td><td>Purchase of fixed assets/investments</td></tr>
<tr><td><b>Financing</b></td><td>Changes in owners' capital and borrowings</td><td>Issue of shares/debentures, long-term loans</td><td>Loan repayment, interest & dividend paid, redemption of preference shares/debentures, buy-back</td></tr></table>
<div class="tip">Interest/dividend <b>received</b> = investing (for non-financial firms). Interest/dividend <b>paid</b> = financing.</div>
<h3>Operating cash flow: indirect method</h3>
<div class="flow">Net profit before tax → + non-cash/non-operating debits (depreciation, goodwill written off, loss on sale of assets, preliminary expenses written off) → − non-operating credits (gain on sale of assets, interest/dividend received) → Operating profit before working-capital changes → + decrease in current assets / increase in current liabilities → − increase in current assets / decrease in current liabilities → − income tax paid = Net cash from operating activities</div>
<p><b>Direct method:</b> gross cash receipts and payments are shown. <b>Indirect:</b> adjust profit for non-cash items.</p>`
},
{
id: 'ratios', unit: 'u3', lec: 'L15', title: 'Ratio analysis',
sum: 'Liquidity, solvency, activity (turnover) and profitability ratios with formulas and ideal norms.',
html: `
<p>A ratio is an arithmetical expression of the relationship between two numbers (A:B). Ratio analysis computes and presents relationships between items in financial statements. <b>Uses:</b> simplifies data, aids management, coordination and control, intra- and inter-firm comparison, useful to shareholders.</p>
<h3>1. Liquidity ratios (short-term position)</h3>
<table><tr><th>Ratio</th><th>Formula</th><th>Ideal</th></tr>
<tr><td>Current ratio</td><td>Current assets ÷ Current liabilities</td><td><b>2:1</b></td></tr>
<tr><td>Quick / acid-test</td><td>Liquid assets ÷ Current liabilities; liquid assets = CA − (stock + prepaid expenses)</td><td><b>1:1</b></td></tr>
<tr><td>Absolute liquid</td><td>(Cash + bank + marketable securities) ÷ Current liabilities</td><td><b>0.5:1</b></td></tr></table>
<h3>2. Solvency ratios (repay outside liabilities)</h3>
<table><tr><th>Ratio</th><th>Formula</th><th>Norm</th></tr>
<tr><td>Debt-equity</td><td>Long-term debt ÷ Shareholders' funds</td><td><b>2:1</b> considered safe</td></tr>
<tr><td>Total assets to debt</td><td>Total assets (excl. fictitious) ÷ Long-term debt</td><td>2:1 safe</td></tr>
<tr><td>Proprietary</td><td>Shareholders' funds ÷ Total assets</td><td>1:1 ideal</td></tr>
<tr><td>Interest coverage</td><td>EBIT ÷ Fixed interest charges</td><td>Higher = safer for lenders</td></tr></table>
<h3>3. Activity / turnover ratios (efficiency of asset use)</h3>
<table><tr><th>Ratio</th><th>Formula</th></tr>
<tr><td>Inventory turnover</td><td>COGS ÷ Average stock; avg stock = (opening + closing) ÷ 2; COGS = opening stock + purchases + direct exp − closing stock (or sales − GP). Higher is better.</td></tr>
<tr><td>Debtors turnover</td><td>Net credit sales ÷ Average receivables. Higher = efficient collection. Collection period = 365 ÷ ratio</td></tr>
<tr><td>Creditors turnover</td><td>Net credit purchases ÷ Average payables</td></tr>
<tr><td>Working capital turnover</td><td>Net sales ÷ Working capital (CA − CL)</td></tr>
<tr><td>Fixed assets turnover</td><td>Net sales (or COGS) ÷ Net fixed assets. Low = under-utilisation</td></tr>
<tr><td>Current assets turnover</td><td>Net sales (or COGS) ÷ Current assets</td></tr></table>
<h3>4. Profitability ratios</h3>
<table><tr><th>Ratio</th><th>Formula</th></tr>
<tr><td>Gross profit ratio</td><td>Gross profit ÷ Net sales × 100</td></tr>
<tr><td>Operating ratio</td><td>(COGS + operating expenses) ÷ Net sales × 100</td></tr>
<tr><td>Net profit ratio</td><td>Net profit after tax ÷ Net sales × 100</td></tr>
<tr><td>ROCE</td><td>EBIT ÷ Capital employed × 100; capital employed = fixed assets (net) + current assets − current liabilities</td></tr>
<tr><td>Return on assets</td><td>Net profit after tax ÷ Average total assets</td></tr>
<tr><td>Return on shareholders' funds</td><td>Net profit after interest & tax ÷ Shareholders' funds × 100</td></tr>
<tr><td>Dividend yield</td><td>Dividend per share ÷ Market price per share × 100</td></tr></table>
<div class="tip"><b>Interpreting in cases:</b> current ratio high but quick ratio low = too much money stuck in inventory. Rising debt-equity = more financial risk. Falling inventory turnover = slow-moving stock. Very high current ratio can mean idle funds.</div>`
},
{
id: 'wcm', unit: 'u3', lec: 'L16', title: 'Working capital management',
sum: 'Working capital, factors affecting it, EOQ, ABC analysis, inventory levels and reorder level, Baumol and Miller-Orr cash models.',
html: `
<div class="formula">Working capital = Current assets − Current liabilities</div>
<p>"The money required to keep the business running every day." CA: cash, bank, inventory, receivables, short-term investments. CL: payables, short-term borrowings, outstanding expenses. Example: CA ₹10 lakh, CL ₹5 lakh → current ratio 2:1 (₹2 of CA per ₹1 of CL).</p>
<p><b>WCM:</b> managing short-term money and assets so daily operations run smoothly: buying materials, holding inventory, paying salaries, suppliers, rent, electricity, extending customer credit, emergencies.</p>
<h3>Factors affecting working capital</h3>
<table><tr><th>Factor</th><th>Effect</th></tr>
<tr><td>Nature of business</td><td>Inventory-intensive (trading/manufacturing) → more WC</td></tr>
<tr><td>Size / scale</td><td>Bigger → more</td></tr><tr><td>Production & operating cycle</td><td>Longer → more</td></tr>
<tr><td>Credit policy to customers</td><td>Liberal → more; strict → less</td></tr><tr><td>Credit from suppliers</td><td>More supplier credit → less</td></tr>
<tr><td>Inventory policy</td><td>High inventory → more</td></tr><tr><td>Seasonality</td><td>Peak season → more</td></tr>
<tr><td>Production policy</td><td>Make-to-stock → more; make-to-order → less</td></tr><tr><td>Collection efficiency</td><td>Slow collection → more</td></tr>
<tr><td>Inflation</td><td>Higher prices → more</td></tr><tr><td>Raw material availability</td><td>Easily available → less inventory needed</td></tr></table>
<p>Cash management: too much cash = idle; too little = can't meet obligations.</p>
<h3>Economic Order Quantity (EOQ)</h3>
<p>"How much should I order at one time?" Too much → storage cost, blocked money, obsolescence, damage. Too little → frequent orders, higher ordering cost, stock-outs. EOQ balances <b>ordering and holding costs</b>.</p>
<div class="formula">EOQ = √(2DS ÷ H)</div>
<p>D = annual demand, S = ordering cost per order, H = holding cost per unit per year. Example: D = 10,000, S = ₹200, H = ₹4 → √(2×10,000×200 ÷ 4) = √10,00,000 = <b>1,000 units</b>.</p>
<h3>ABC analysis</h3>
<table><tr><th>Class</th><th>Items</th><th>Value</th><th>Control</th><th>Example</th></tr>
<tr><td><b>A</b></td><td>Few</td><td>Large share of value</td><td>Tightest</td><td>100 processors = ₹50 lakh</td></tr>
<tr><td><b>B</b></td><td>Medium</td><td>Medium</td><td>Moderate</td><td>1,000 keyboards = ₹10 lakh</td></tr>
<tr><td><b>C</b></td><td>Many</td><td>Low total value</td><td>Simple</td><td>20,000 screws = ₹1 lakh</td></tr></table>
<h3>Inventory levels</h3>
<ul><li><b>Minimum level:</b> safety cushion that should normally be maintained</li><li><b>Maximum level:</b> highest normally held (excess blocks money)</li>
<li><b>Re-order level = Usage × Lead time</b>. Restaurant using 20 kg rice/day with 5-day supplier lead time: 20 × 5 = <b>100 kg</b>, so reorder when stock hits 100 kg</li></ul>
<p>Too much phone stock: ₹50 lakh idle, models go obsolete. Too little: "out of stock", customers go to competitors.</p>
<h3>Cash management models</h3>
<table><tr><th>Baumol model</th><th>Miller-Orr model</th></tr>
<tr><td>Cash flows <b>predictable</b>/regular</td><td>Cash flows <b>uncertain</b>/fluctuating</td></tr>
<tr><td>Finds optimal cash conversion amount balancing <b>transaction cost vs opportunity cost</b> of holding cash. "EOQ for cash"</td><td>Sets <b>lower limit, upper limit and target (return) level</b>; act when cash crosses a limit. Control-limit approach</td></tr>
<tr><td></td><td>Bank balance target ₹50,000: at ₹1 lakh invest the excess; at ₹20,000 transfer money in</td></tr></table>`
},
{
id: 'capstr', unit: 'u3', lec: 'L17', title: 'Financial management & capital structure',
sum: 'Scope and techniques of financial management, debt vs equity, leverage, NI, Traditional, NOI and MM approaches.',
html: `
<h3>Financial management</h3>
<ul><li>Hoagland: how corporations obtain funds and how they use them</li><li>Archer & Ambrosio: application of planning and control to the finance function</li>
<li>Raymond Chambers: management of the finance function</li></ul>
<p><b>Scope:</b> forecasting financial needs, financing (acquiring capital), allocation and investment of funds (capital budgeting), coordination and control, profit planning. <b>Four decisions:</b> investment, financing, working capital, dividend.</p>
<p><b>Techniques:</b> ratio analysis; capital budgeting (payback, ARR, NPV, IRR, profitability index, discounted payback); working capital tools (EOQ, ABC, inventory levels, cash models); capital structure analysis (leverage, EPS–EBIT, indifference point).</p>
<h3>Capital structure</h3>
<p>The <b>mix of debt and equity</b> used to finance operations and growth. <b>Optimum capital structure</b> = the mix that <b>minimises cost of capital and maximises firm value</b>.</p>
<ul><li><b>Cost:</b> debt is usually cheaper (interest is tax-deductible = <b>tax shield</b>), but too much debt raises bankruptcy risk</li>
<li><b>Control:</b> equity dilutes ownership; lenders don't control unless you default</li>
<li><b>Risk vs return:</b> leverage magnifies EPS in good times and losses in bad times</li></ul>
<table><tr><th>Basis</th><th>Equity</th><th>Debt</th></tr>
<tr><td>Meaning</td><td>Owners' money</td><td>Borrowed money</td></tr><tr><td>Ownership</td><td>Yes</td><td>No</td></tr>
<tr><td>Return</td><td>Dividend / capital appreciation, not fixed</td><td>Fixed interest</td></tr><tr><td>Repayment</td><td>No fixed maturity</td><td>Required</td></tr>
<tr><td>Risk to firm</td><td>Lower fixed obligation</td><td>Higher fixed obligation</td></tr><tr><td>Control</td><td>Dilutes</td><td>Normally doesn't dilute</td></tr>
<tr><td>Example</td><td>Shares</td><td>Bank loan, bonds, debentures</td></tr></table>
<table><tr><th>Operating leverage</th><th>Financial leverage</th></tr>
<tr><td>Fixed <b>operating</b> costs (rent, salaries, depreciation)</td><td>Fixed <b>financial</b> costs (interest on debt)</td></tr>
<tr><td>Affects EBIT → <b>business risk</b></td><td>Affects profit for equity holders → <b>financial risk</b></td></tr></table>
<h3>Capital structure theories</h3>
<table><tr><th></th><th>Relevance theories</th><th>Irrelevance theories</th></tr>
<tr><td>Claim</td><td>Capital structure <b>affects</b> firm value & cost of capital</td><td>Capital structure <b>does not</b> affect firm value (ideal conditions)</td></tr>
<tr><td>Approaches</td><td><b>Net Income (NI)</b> – David Durand; <b>Traditional</b></td><td><b>Net Operating Income (NOI)</b>; <b>Modigliani–Miller (MM)</b></td></tr>
<tr><td>Optimum structure</td><td>Exists</td><td>Not necessary</td></tr><tr><td>Cost of capital</td><td>Changes with mix</td><td>Constant</td></tr></table>
<ul><li><b>NI approach:</b> more debt → lower overall cost → higher value (assuming debt stays cheap)</li>
<li><b>Traditional:</b> middle path; moderate debt lowers cost (0%→20%→40%), but beyond a point (60–80%) risk and cost rise. Find the optimum</li>
<li><b>NOI:</b> overall cost (e.g., 10%) stays constant whether 20:80 or 50:50 debt-equity, because cheaper debt is offset by shareholders demanding higher returns for higher risk</li>
<li><b>MM:</b> under perfect markets, value depends on operating income and business risk, not the debt-equity mix</li></ul>
<p><b>Relevance assumptions:</b> debt cheaper than equity (e.g., 8% vs 14%), rational investors, constant business risk, stable earnings, optimum structure exists. <b>Irrelevance assumptions:</b> perfect capital market, no taxes, no transaction costs, homogeneous expectations, borrow at the same rate, constant business risk.</p>`
},
{
id: 'hrm', unit: 'u3', lec: 'L18', title: 'Human resource management & HR functions',
sum: 'Definition, managerial vs operative functions (Flippo), Ulrich\'s four roles, centralised vs decentralised HR, HR outcome measures.',
html: `
<h3>HRM</h3>
<p>A <b>strategic approach</b> to managing employment relations that emphasises leveraging people's capabilities as critical to sustainable competitive advantage, through integrated policies and practices. Also: acquiring, developing, maintaining and retaining human resources to achieve goals. HRM sees employees as an <b>asset to be nurtured, not a cost to be controlled</b>.</p>
<h3>Dave Ulrich's four HR roles</h3>
<table><tr><th>Role</th><th>Focus</th></tr>
<tr><td>Strategic partner</td><td>Aligning HR with business strategy</td></tr><tr><td>Change agent</td><td>Driving transformation</td></tr>
<tr><td>Employee champion</td><td>Representing employee interests, well-being</td></tr><tr><td>Administrative expert</td><td>Running HR processes efficiently</td></tr></table>
<h3>Managerial functions of HR (Flippo)</h3>
<p>Planning (forecast HR needs), organising (HR structure, roles), directing (lead and motivate), controlling (monitor HR metrics, compliance). General managerial functions also include staffing.</p>
<h3>Operative functions</h3>
<table><tr><th>Function</th><th>Purpose</th><th>Activities</th></tr>
<tr><td><b>Procurement</b></td><td>Right people, right job, right time</td><td>HR planning, job analysis, recruitment, selection, placement, induction</td></tr>
<tr><td><b>Development</b></td><td>Build capabilities</td><td>Training, management development, career planning, appraisal, succession planning</td></tr>
<tr><td><b>Compensation</b></td><td>Reward fairly</td><td>Job evaluation, wage/salary admin, incentives, benefits, bonus</td></tr>
<tr><td><b>Integration</b></td><td>Align individual & organisational goals</td><td>Motivation, satisfaction, grievance handling, discipline, industrial relations, engagement</td></tr>
<tr><td><b>Maintenance</b></td><td>Retain talent, well-being</td><td>Health & safety, welfare (canteen, transport, medical), retention, work-life balance, EAPs</td></tr>
<tr><td><b>Human relations</b></td><td>Build relationships</td><td>Communication, conflict resolution, team building, culture, employee voice</td></tr>
<tr><td><b>Research & information</b></td><td>Data-driven decisions</td><td>HR analytics, exit interviews, attitude surveys, benchmarking, HR audits, trend analysis</td></tr></table>
<p>Other HR areas from the slides: performance management (objectives, monitoring, discipline, grievances, development needs), reward management (pay, performance pay, benefits, non-financial rewards), HRD (learning organisation, training, career and management development), employee relations, HR services (policies, HRIS, compliance).</p>
<h3>Sharing HR responsibility</h3>
<ul><li><b>Centralised:</b> strategic issues (change management, HR planning, policy), organisation-wide communication and employee relations, research and auditing</li>
<li><b>Decentralised:</b> delegating people-management authority to <b>line managers and team leaders</b> for their own staff</li></ul>
<h3>Measuring HR outcomes</h3>
<p><b>Quantitative:</b> staff turnover, absenteeism, production days, training success, grievance incidents. <b>Qualitative:</b> motivation, team spirit, job satisfaction, line managers' acceptance of HR policies. Also performance criteria, problem evaluation, quality of work life, benchmarking.</p>`
},
{
id: 'recruit', unit: 'u3', lec: 'L19', title: 'Recruitment & selection',
sum: 'Recruitment process, internal vs external sources, direct/indirect/third-party/internet methods, recruitment vs selection, selection steps.',
html: `
<h3>Recruitment</h3>
<p>Searching for prospective employees and <b>stimulating and encouraging them to apply</b>, in enough numbers that the organisation can choose the most appropriate person.</p>
<div class="flow">HR requisition → Locate & develop sources → Identify prospects → Communicate about the organisation → Encourage them to apply → Evaluate effectiveness</div>
<h3>Sources</h3>
<ul><li><b>Internal:</b> present employees (promotion, transfer), retired employees, employee referrals. Motivating, cheaper, known performance, but limits fresh ideas.</li>
<li><b>External:</b> campus, advertisements, agencies, job portals, walk-ins. New talent and wider choice, but costlier and slower.</li></ul>
<h3>Techniques</h3>
<table><tr><th>Method</th><th>How</th><th>When used</th></tr>
<tr><td><b>Direct</b></td><td>Campus recruitment, job fairs, walk-ins, direct calls/emails</td><td>Urgent hiring, employer branding</td></tr>
<tr><td><b>Indirect</b></td><td>Newspaper, radio/TV, posters, magazines, brochures</td><td>Large and diverse applicant pool</td></tr>
<tr><td><b>Third-party</b></td><td>Employment agencies, consultants, <b>executive search (headhunters)</b>, labour contractors</td><td>Specialised talent, hard-to-fill or <b>confidential</b> roles (replacing a senior manager)</td></tr>
<tr><td><b>Internet / e-recruitment</b></td><td>Career pages, Naukri, LinkedIn, social media, online tests</td><td>Fast, low-cost, global reach, automation</td></tr></table>
<p>Considerations: political, legal, social, economic. Indian practices: internal sources, public employment exchanges, campus, executive search, labour contractors, referrals.</p>
<p><b>Recruiting goals:</b> many candidates, highly qualified, fill fast, at minimal cost, good performers who stay, positive PR. <b>Philosophy:</b> internal vs external, fill vacancies vs hire for careers, diversity, marketing orientation, ethics. <b>Choices:</b> plans, timing (before peak season, campus cycles, notice periods), methods, sources.</p>
<h3>Selection</h3>
<p>Using specific instruments to choose, from the applicant pool, those most likely to succeed given management goals and legal requirements. Divides applicants into <b>suitable and unsuitable</b>.</p>
<table><tr><th>Basis</th><th>Recruitment</th><th>Selection</th></tr>
<tr><td>Meaning</td><td>Searching for candidates</td><td>Choosing the right candidates</td></tr>
<tr><td>Nature</td><td><b>Positive</b> process</td><td><b>Negative</b> process (rejects)</td></tr>
<tr><td>Purpose</td><td>Create a large pool</td><td>Reject unsuitable</td></tr><tr><td>Sequence</td><td>Comes first</td><td>Follows recruitment</td></tr>
<tr><td>Contract</td><td>No contract of service</td><td>Leads to a contract of service</td></tr></table>
<div class="flow">Application bank → Preliminary interview → Selection tests → Employment interview → Medical examination → Reference check → Final approval → Placement → Induction / orientation</div>`
},
{
id: 'appraisal', unit: 'u3', lec: 'L20', title: 'Performance appraisal',
sum: 'PA process, who appraises (360°, 720°), rating errors, interview types, methods: rating scales, BARS, forced distribution, essay, critical incident, MBO.',
html: `
<p><b>Performance appraisal:</b> systematic evaluation of an employee's performance over a period: "a report card of an employee". Used for increments, promotions, training needs, feedback and motivation.</p>
<div class="flow">Establish standards → Communicate standards → Measure actual performance → Compare with standards → Give feedback → Take corrective action</div>
<p>Modern firms use <b>continuous feedback</b> and real-time tracking (Google uses ongoing feedback instead of yearly reviews).</p>
<p><b>Uses:</b> compensation (pay for performance), performance improvement, feedback, documentation, promotion, training needs, HR planning. Survey: compensation is the most common use (~75%).</p>
<h3>Who appraises</h3>
<ul><li><b>Supervisor:</b> immediate manager, reviewed one level up</li><li><b>Self:</b> employee fills a form before review</li>
<li><b>Subordinate:</b> employees rate their boss; better for <b>development</b> than admin decisions</li><li><b>Peer:</b> co-workers, compiled for the manager</li>
<li><b>Team:</b> based on TQM; rewards team accomplishment</li><li><b>Customers</b></li>
<li><b>360°:</b> supervisors, peers, subordinates, customers, self, teams</li></ul>
<h3>720° appraisal</h3>
<p>360° feedback → <b>development phase</b> (training, coaching, mentoring) → second 360° to <b>measure improvement</b>. Used at Infosys, TCS.</p>
<table><tr><th></th><th>360°</th><th>720°</th></tr>
<tr><td>Cycles</td><td>One</td><td>Two</td></tr><tr><td>Focus</td><td>Evaluation</td><td>Evaluation + improvement</td></tr>
<tr><td>Development phase</td><td>Not mandatory</td><td>Essential</td></tr><tr><td>Outcome</td><td>Performance review</td><td>Performance enhancement</td></tr></table>
<h3>Problems and rating errors</h3>
<p>Problems: popularity contests, fear of punitive use, managers uncomfortable judging, stereotypes, poorly trained raters.</p>
<table><tr><th>Error</th><th>What happens</th><th>Fix</th></tr>
<tr><td><b>Halo</b></td><td>One good (or bad) trait colours ratings on all factors</td><td>Rate each factor separately, clear dimensions</td></tr>
<tr><td><b>Leniency / strictness</b></td><td>Unusually high / unusually low ratings for everyone</td><td>Define anchors, force a curve</td></tr>
<tr><td><b>Central tendency</b></td><td>Everyone rated "average"</td><td>Explain need for variability</td></tr>
<tr><td><b>Recency</b></td><td>Based mainly on the last month's behaviour</td><td>Frequent evaluation, documentation</td></tr>
<tr><td><b>Similar-to-me</b></td><td>Inflated rating due to personal connection/similarity</td><td>Rater training, multiple raters</td></tr></table>
<p>Rater training: explain objectives, review the form, define standards, teach about errors, teach interview skills. Standards must be <b>relevant, free from contamination, reliable</b> (inter-rater consistency).</p>
<h3>Appraisal interviews</h3>
<p>Schedule 10–14 days in advance; employee self-reviews first.</p>
<ul><li><b>Tell-and-sell:</b> supervisor persuades the employee to change in a prescribed way</li>
<li><b>Tell-and-listen:</b> supervisor covers strengths/weaknesses, then listens to the employee's feelings, handles disagreement, negotiates goals</li>
<li><b>Problem-solving (generally preferable):</b> joint discussion, listening, exploring feelings, stimulating growth</li></ul>
<p>Tips: emphasise strengths, listen more than talk, focus on present growth opportunities, <b>avoid the sandwich technique</b>.</p>
<h3>Methods</h3>
<table><tr><th>Method</th><th>Basis</th><th>Plus</th><th>Minus</th><th>Best for</th></tr>
<tr><td>Graphic rating scale</td><td>Traits on 1–5 scale</td><td>Simple, cheap</td><td>Subjective, bias</td><td>Large workforce</td></tr>
<tr><td><b>BARS</b></td><td>Observable behaviours anchor each scale point</td><td>Accurate, less bias</td><td>Time-consuming</td><td>Skill-based jobs</td></tr>
<tr><td>Forced distribution</td><td>Bell curve: few excellent, most average, few poor</td><td>Differentiates employees</td><td>Can be unfair</td><td>Competitive firms</td></tr>
<tr><td>Forced choice</td><td>Rater picks from statements that distinguish success/failure</td><td>Reduces bias</td><td>Hard to design</td><td></td></tr>
<tr><td>360°</td><td>Multi-source</td><td>Holistic</td><td>Complex, costly</td><td>Leadership roles</td></tr>
<tr><td><b>MBO</b></td><td>Achievement of goals set <b>jointly</b> (Peter Drucker)</td><td>Clear, measurable targets, participation</td><td>Ignores behaviour, unrealistic goals, some goals hard to define</td><td>Managerial roles</td></tr>
<tr><td>Checklist</td><td>Yes/No statements</td><td>Easy</td><td>Limited depth</td><td>Routine jobs</td></tr>
<tr><td>Essay</td><td>Written description of strengths/weaknesses</td><td>Detailed</td><td>Subjective, depends on writing</td><td>Small teams</td></tr>
<tr><td>Critical incident</td><td>Unusual events showing superior/inferior performance</td><td>Evidence-based</td><td>Needs constant recording</td><td></td></tr></table>
<p><b>Developing BARS:</b> collect critical incidents → group into dimensions (communication, teamwork) → scale behaviours 1–5 → anchor each point with a behaviour. E.g., 5 = "resolves customer issues quickly, stays calm, exceeds expectations"; 1 = "fails to resolve issues, rude or unresponsive". Average score bands: 4.5–5 outstanding, 3.5–4.4 very good, 2.5–3.4 good, 1.5–2.4 needs improvement, below 1.5 poor.</p>`
},
{
id: 'comp', unit: 'u3', lec: 'L21', title: 'Compensation, incentives & employee engagement',
sum: 'Wage & salary administration, wages vs salary, objectives, salary elements, time/piece rate, incentives, fringe benefits, engagement.',
html: `
<h3>Wage & salary administration</h3>
<p>The systematic process of designing, implementing and managing employee compensation: a <b>strategic HR function</b> ensuring fair, competitive and systematic pay. Involves designing pay structures, job evaluation, market benchmarking, linking pay to performance, legal compliance. Compensation is a <b>tool for motivation and retention, not just a cost</b> (Infosys uses analytics and global benchmarks).</p>
<table><tr><th>Wages</th><th>Salary</th></tr>
<tr><td>Manual/operational work; hourly/daily or output basis</td><td>Managerial, administrative, professional roles</td></tr>
<tr><td>Short cycle (daily/weekly), linked to productivity</td><td>Fixed, monthly, stable; includes allowances; not tied to daily output</td></tr>
<tr><td>Factory worker ₹800/day</td><td>Marketing manager ₹50,000/month</td></tr></table>
<p>Types of wages: <b>time wages, piece wages, minimum wages</b> (by law).</p>
<h3>Objectives</h3>
<ul><li><b>Internal equity:</b> similar work → fair, equal pay inside the firm (two Wipro engineers in the same role paid differently → dissatisfaction)</li>
<li><b>External competitiveness:</b> pay comparable to industry, or people leave</li>
<li>Motivate employees, retain talent</li>
<li><b>Legal compliance:</b> Minimum Wages Act, Payment of Wages Act, Equal Remuneration Act</li></ul>
<p>Importance: less dissatisfaction, higher productivity, attracts skilled workforce, industrial peace.</p>
<h3>Salary elements</h3>
<p>Basic pay (fixed), <b>Dearness Allowance</b> (inflation adjustment), HRA, conveyance, special allowances, bonus, <b>Provident Fund</b>.</p>
<h3>Methods of wage payment</h3>
<table><tr><th>Time rate</th><th>Piece rate</th><th>Combination</th></tr>
<tr><td>Pay per hour/day/month; simple, stable income, suits <b>non-measurable</b> work; no productivity incentive</td><td>Pay per unit produced; high productivity, performance-based; <b>quality may suffer</b></td><td>Time base + performance incentive</td></tr></table>
<h3>Incentive plans</h3>
<p>Rewards over and above salary to motivate higher performance; reward efficiency, reduce supervision, align goals.</p>
<ul><li><b>Financial:</b> bonus, commission, profit sharing, piece-rate incentive</li>
<li><b>Non-financial:</b> recognition (employee of the month), promotion, job enrichment, flexible hours, training (Google)</li></ul>
<table><tr><th>Individual incentives</th><th>Group incentives</th></tr>
<tr><td>Based on own performance; encourage competition, can create unhealthy rivalry, focus on quantity</td><td>Based on team target (sales team bonus); build teamwork and cooperation</td></tr></table>
<h3>Fringe benefits</h3>
<p><b>Indirect compensation</b> beyond salary (perks): security (PF, gratuity, pension), health (insurance, check-ups, wellness), work-life (paid leave, flexible hours, WFH), welfare (canteen, transport, childcare), recreational (gym, outings, events). Improve morale, reduce turnover, build loyalty.</p>
<table><tr><th>Basis</th><th>Incentives</th><th>Fringe benefits</th></tr>
<tr><td>Nature</td><td>Performance-based</td><td>Welfare-based</td></tr><tr><td>Type</td><td>Direct payment</td><td>Indirect compensation</td></tr>
<tr><td>Purpose</td><td>Motivation</td><td>Satisfaction & retention</td></tr><tr><td>Example</td><td>Bonus, commission</td><td>Insurance, PF</td></tr></table>
<h3>Employee engagement</h3>
<p>The level of <b>emotional commitment, involvement and enthusiasm</b> employees have toward their organisation and work. Engaged employees don't work only for salary; they feel their work has meaning and their contribution is valued.</p>
<p><b>Benefits:</b> productivity, retention, customer service, creativity & innovation, teamwork. <b>Methods:</b> communication, recognition, training & careers, participation in decisions, work-life balance, supportive leadership, team-building, feedback surveys, fair pay.</p>`
},
{
id: 'training', unit: 'u3', lec: 'L22', title: 'Training & development',
sum: 'Gap concept, ASK, training vs education vs development, on-the-job vs off-the-job methods.',
html: `
<h3>Identifying training needs: the gap concept</h3>
<p>Expected 1,000 cars, actual 800 → a <b>gap of 200</b>. Something (skills, knowledge, attitude) prevents targets being met; training bridges the gap between actual and desired performance.</p>
<p><b>ASK concept:</b> the gap is in <b>Attitude, Skills, Knowledge</b>.</p>
<p>Other triggers: <b>employee obsolescence</b> (new tech, systems, computerisation), <b>career plateaus</b>, <b>employee turnover</b> (new joiners need development plans).</p>
<h3>Training</h3>
<p>A <b>planned, systematic</b> process through which employees gain knowledge and skills by instruction and practical activities, improving organisational performance. Not random or informal.</p>
<p><b>Importance:</b> maintains product/service quality, high service standards, informs newcomers, refreshes old employees, teaches new tech, reduces mistakes and costs, invites feedback, improves communication and teamwork.</p>
<table><tr><th></th><th>Education</th><th>Training</th></tr>
<tr><td>Scope</td><td>Broad, general</td><td>Narrow, job-specific</td></tr><tr><td>Nature</td><td>Theoretical</td><td>Applied, practical</td></tr>
<tr><td>Duration</td><td>Long</td><td>Short</td></tr><tr><td>Results</td><td>Delayed</td><td>Quick, visible</td></tr>
<tr><td>Initiated by</td><td>Individual (lifetime investment)</td><td>Organisation</td></tr></table>
<table><tr><th></th><th>Training</th><th>Development</th></tr>
<tr><td>Content</td><td>Technical, mechanical</td><td>Conceptual, philosophical</td></tr><tr><td>Participants</td><td>Non-managerial</td><td>Managerial</td></tr>
<tr><td>Time</td><td>Short-term</td><td>Long-term, continuous</td></tr><tr><td>Purpose</td><td>Specific job skill</td><td>Total personality</td></tr>
<tr><td>Motivation</td><td>External</td><td>Internal</td></tr><tr><td>Process</td><td>Reactive</td><td>Proactive</td></tr></table>
<h3>Methods</h3>
<table><tr><th>On-the-job training (OJT)</th><th>Off-the-job training</th></tr>
<tr><td>Learn while doing actual tasks, guided by supervisors/experienced co-workers; practical, immediately applicable, <b>low cost</b>; best for technical, operational, hands-on skills</td>
<td>Away from the workplace: in-house classroom, external consultancies/classes, government talks, distance learning, computer-assisted learning, interactive video, video conferencing; e.g., a sales team workshop on communication/CRM</td></tr></table>`
},
{
id: 'hrtrends', unit: 'u3', lec: 'L23', title: 'HR trends & challenges',
sum: 'Personnel management → strategic HRM, globalization, deregulation & gig work, digital HR (AI, analytics, e-HRM, remote work), HRM in India.',
html: `
<h3>Personnel management → Strategic HRM</h3>
<table><tr><th>Basis</th><th>Personnel management</th><th>Strategic HRM</th></tr>
<tr><td>Focus</td><td>Administrative (hiring, payroll, attendance)</td><td>Strategic</td></tr><tr><td>Role</td><td>Support function</td><td>Core business partner</td></tr>
<tr><td>Approach</td><td>Reactive</td><td>Proactive, future-oriented</td></tr><tr><td>Employee view</td><td>Cost / labour</td><td>Asset / talent</td></tr>
<tr><td>Goal</td><td>Efficiency</td><td>Competitive advantage</td></tr></table>
<p>HR as business partner: strategic partner (hire digital talent for tech expansion), change agent (digital transformation), employee champion, administrative expert. "People are the biggest source of competitive advantage." Drivers: global competition, liberalisation, digital transformation.</p>
<h3>Globalization</h3>
<p>Integration of labour markets, operations and workforce management across countries (developers in India, managers in the US, clients in Europe). Trends: <b>global talent management, international recruitment, expatriate management</b> (relocation, compensation, adjustment), <b>talent mobility</b>.</p>
<p><b>Cross-cultural management:</b> USA individualistic, Japan team-oriented, India hierarchical. Practices: diversity & inclusion, cultural training, inclusive leadership. <b>Flexible work:</b> remote, hybrid, flexible hours.</p>
<h3>Deregulation</h3>
<p>Reduction of government rules: "less control, more freedom for business". India's <b>1991 liberalisation</b> reduced licensing, trade barriers and intervention → MNC entry → competition → need for efficient HR.</p>
<ul><li><b>Labour law reforms:</b> simpler laws, labour codes, flexible hiring/firing → more employer power, less job security</li>
<li><b>Gig economy:</b> permanent → contract/freelance. Ravi, a Delhi student, delivers for Zomato: no fixed salary, paid per delivery, flexible hours, quick income</li>
<li><b>Downsizing & restructuring:</b> cut workforce/costs, change structure</li>
<li><b>Labour flexibility / hire-and-fire:</b> adapts quickly and cuts costs, but causes insecurity and lower loyalty (startup hires 200, fires 100 → employees feel betrayed)</li></ul>
<h3>Digital transformation in HR</h3>
<p>Integrating tech so HR is faster, data-driven, efficient and employee-centric. Manual → automated; paper → cloud; intuition → data; slow → fast.</p>
<ul><li><b>AI in recruitment:</b> IBM Watson screens thousands of applications → faster, cheaper, less bias. Risks: over-reliance on algorithms, no human judgment, AI bias. "AI can shortlist talent, but humans must make final decisions."</li>
<li><b>HR analytics:</b> track productivity, predict turnover, measure performance and engagement, spot burnout. Microsoft's data showed a need for flexibility → hybrid model. Benefits: less guesswork. Challenges: privacy, misinterpretation. "What gets measured gets managed."</li>
<li><b>E-HRM:</b> online records, payroll, leave, recruitment portals. SAP SuccessFactors: apply for leave, check salary, access training. Benefits: transparency, accessibility. Challenges: cost, training. "HR is no longer a department, it's a digital platform."</li>
<li><b>Remote work tech:</b> Zoom, Teams, Slack (COVID-19). Benefits: flexibility, savings, global collaboration. Challenges: communication gaps, isolation, work-life imbalance. "Work is no longer a place, it's an activity."</li></ul>
<h3>HRM in India</h3>
<p>Cultural diversity, family-owned businesses, emphasis on relationships, skill development initiatives, labour-intensive industries.</p>
<p><b>Balancing act:</b> technology vs human touch, flexibility vs security, global practices vs local realities.</p>`
},
{
id: 'marketing', unit: 'u3', lec: 'L24', title: 'Marketing: concepts, philosophies & the marketing mix',
sum: 'Marketing myths, Kotler\'s definitions, six marketing philosophies, marketing myopia, 4Ps, 7Ps and the 11Ps of digital marketing.',
html: `
<div class="tip"><b>"Marketing is not selling, it is identifying the needs."</b> Marketing is about people, not products.</div>
<h3>Common misconceptions</h3>
<p>Marketing is <b>not</b> just advertising, sales, fooling people, door-to-door selling or show business. Not "anyone can do it", and every business needs it.</p>
<h3>What marketing is</h3>
<ul>
<li><b>AMA view:</b> an organisational function and a set of processes for <b>creating, communicating and delivering value</b> to customers and <b>managing customer relationships</b> in ways that benefit the organisation and its stakeholders.</li>
<li><b>Marketing concept:</b> the company's main task is to find what a target set of customers <b>needs, wants and values</b>, and dedicate the organisation to delivering that solution.</li>
<li><b>Philip Kotler:</b> "satisfying needs and wants through an exchange process".</li>
<li>"All the activities involved in the transfer of goods and services to the ultimate consumer."</li>
<li><b>Managing profitable customer relationships</b>, with a twofold goal: <b>attract new customers</b> by promising superior value, and <b>keep and grow current customers</b> by delivering satisfaction.</li>
</ul>
<div class="def"><b>Marketing management</b> is the art and science of choosing target markets and getting, keeping and growing customers through creating, delivering and communicating superior customer value.</div>
<p>In full: the <b>analysis, planning, implementation and control</b> of programmes designed to bring about desired exchanges with target audiences for personal and mutual gain, relying on coordination of <b>product, price, place and promotion</b>.</p>
<h3>What can be marketed, and to whom</h3>
<p><b>10 things:</b> goods, services, places, ideas, events, persons, properties, organisations, information, experiences.</p>
<p><b>Markets:</b> consumer, business, global, nonprofit/government; also urban and rural markets.</p>
<h3>Six marketing philosophies (in order of evolution)</h3>
<table><tr><th>Philosophy</th><th>Belief</th><th>Focus</th><th>Example / problem</th></tr>
<tr><td><b>Production concept</b></td><td>Demand &gt; supply. Customers want products that are <b>widely available and cheap</b></td><td>Production and distribution efficiency</td><td>Basic low-cost feature phones</td></tr>
<tr><td><b>Product concept</b></td><td>Customers want the best <b>quality, performance and innovative features</b></td><td>R&amp;D, new product development</td><td>Xiaomi. Risk: <b>marketing myopia</b></td></tr>
<tr><td><b>Selling concept</b></td><td>Customers won't buy enough unless <b>pushed</b></td><td>Aggressive hard-sell, sales targets/quotas</td><td><b>Unsought goods</b>: HomeShop18, Sona belt, cemetery plots, election candidates</td></tr>
<tr><td><b>Marketing concept</b></td><td>Find the <b>needs and wants</b> of the target market and deliver them better than competitors</td><td>Customer needs</td><td>Apple, Tata Magic, Scooty</td></tr>
<tr><td><b>Societal marketing concept</b></td><td>Balance <b>company profits, consumer wants and society's welfare</b></td><td>Long-term human welfare</td><td>Honda, recycled bags, no child labour (vs "the ugly face of beauty")</td></tr>
<tr><td><b>Holistic marketing concept</b></td><td>Everything matters: integrate value exploration, creation and delivery for long-term mutual relationships</td><td>The business as one entity with a shared purpose</td><td>Combines internal, integrated, relationship and performance marketing</td></tr></table>
<h4>Marketing myopia</h4>
<p>Sellers pay more attention to the <b>specific products</b> they offer than to the <b>benefits and experiences</b> those products produce. They focus on "wants" and lose sight of the underlying "needs". Examples on the slide: <b>Nokia</b> and <b>BlackBerry</b> (loved their phones, missed the smartphone shift) and <b>Harley-Davidson</b> exiting India in 2020 (fewer than 2,500 units sold that year).</p>
<h4>Selling concept vs marketing concept</h4>
<table><tr><th></th><th>Starting point</th><th>Focus</th><th>Means</th><th>Ends</th></tr>
<tr><td><b>Selling concept</b></td><td>Factory</td><td>Existing products</td><td>Selling and promoting</td><td>Profits through <b>sales volume</b></td></tr>
<tr><td><b>Marketing concept</b></td><td>Market</td><td>Customer needs</td><td>Integrated marketing</td><td>Profits through <b>customer satisfaction</b></td></tr></table>
<p>Selling is <b>inside-out</b>; marketing is <b>outside-in</b>.</p>
<h4>Holistic marketing: 4 components</h4>
<ul><li><b>Internal marketing:</b> marketing department, senior management, other departments</li>
<li><b>Integrated marketing:</b> communications, products &amp; services, channels</li>
<li><b>Relationship marketing:</b> customers, channel, partners</li>
<li><b>Performance marketing:</b> sales revenue, brand and customer equity, ethics, environment, legal, community</li></ul>
<h3>Marketing mix</h3>
<p>The set of tools or tactics a firm uses to pursue its marketing objectives in the target market: the <b>right product, right place, right time, right price</b>.</p>
<table><tr><th>Product mix</th><th>Price mix</th><th>Place mix</th><th>Promotion mix</th></tr>
<tr><td>Variety, quality, design, features, brand name, packaging, sizes, services, warranties, returns</td>
<td>List price, discounts, allowances, payment period, credit terms; strategies like <b>skimming</b> (high launch price) and <b>penetration</b> (low price to win share)</td>
<td>Channels, coverage, location, inventory, transport (assortments)</td>
<td>Advertising, sales promotion, sales force (personal selling), public relations, direct marketing, publicity</td></tr></table>
<h3>7Ps of services marketing</h3>
<p>Services are intangible, so add three Ps to the 4Ps:</p>
<ul><li><b>People:</b> staff and customers involved in delivery (waiters, doctors, bank staff)</li>
<li><b>Process:</b> how the service is delivered (ordering, waiting, payment, delivery steps)</li>
<li><b>Physical evidence:</b> the tangible cues of an intangible service (ambience, interiors, uniforms, website, receipts)</li></ul>
<h3>ICT and marketing: 11Ps</h3>
<p>The virtual world adds four more to the 7Ps: <b>Privacy, Personal interests, Personal networks</b> (social networks) and <b>Public commentary</b> (ratings and reviews).</p>
<h3>Also on ma'am's topic list for this lecture</h3>
<p>The slides list these topics but don't explain them yet. Here are the standard textbook basics (Kotler &amp; Keller) in case they come up:</p>
<ul><li><b>STP:</b> <b>Segmentation</b> (divide the market by demographic, geographic, psychographic, behavioural factors) → <b>Targeting</b> (choose which segments to serve) → <b>Positioning</b> (the distinct place the brand occupies in customers' minds).</li>
<li><b>Customer value proposition:</b> the promise of benefits that makes a target customer choose you over rivals: "for [target], we offer [benefit], unlike [alternative]".</li>
<li><b>Brand basics:</b> a brand is a name, term, sign, symbol or design that identifies a seller's offering. Strong brands create loyalty and let firms charge a premium (brand equity).</li>
<li><b>Digital marketing:</b> using digital channels (search, social media, email, apps, influencers) to reach customers; measurable and personalised.</li></ul>
<div class="tip"><b>Case answer tip:</b> Name the philosophy the firm follows (e.g. "selling concept: pushing stock through discounts"), point out myopia if it's in love with its product, then recommend a marketing-concept fix using the 4Ps (or 7Ps for a service).</div>`
}
];

window.CASE_GUIDE = `
<h3>How to crack scenario & case questions</h3>
<p>Ma'am's course objective is "case-method discipline: <b>read, identify, analyse, recommend</b>". Use that exact sequence.</p>
<ol>
<li><b>Read the question first</b>, then the case. Underline numbers, names, complaints and quotes.</li>
<li><b>Identify the concept</b> the case is testing. Clue words: "two bosses" → organising/unity of command; "observed", "attention" → Hawthorne; "suppliers few" → supplier power; "sell the loss-making division" → divestment; "rated everyone average" → central tendency.</li>
<li><b>Analyse</b> using a named framework: POLC, Mintzberg, PESTEL, Five Forces, SWOT/TOWS, generic strategy, VRIO, ratios, recruitment sources, appraisal methods.</li>
<li><b>Recommend</b> 2–4 specific actions, each justified by the framework and the case facts.</li>
<li><b>Conclude</b> with one line linking back to the goal (growth, profit, customer value, ethics).</li>
</ol>
<h3>For MCQ-style scenarios</h3>
<ul><li>Eliminate options that are true statements but don't answer <i>this</i> scenario.</li>
<li>Watch for internal vs external (SWOT), backward vs forward (integration), efficiency vs effectiveness, recruitment vs selection, incentives vs fringe benefits.</li>
<li>If two options look right, pick the one that matches the <b>specific detail</b> in the case.</li></ul>
<h3>Answer template for a 10-mark case</h3>
<div class="flow">Problem (2 lines) → Concept/framework named → Analysis using 3–4 case facts → Recommendations with reasons → Conclusion</div>`;
