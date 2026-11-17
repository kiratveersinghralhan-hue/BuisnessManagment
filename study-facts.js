const facts = [
  [
    "Linear algebra",
    "Matrix multiplication depends on order. Even when both products exist, AB and BA can have different values.",
  ],
  [
    "Programming",
    "Python’s range stops before its endpoint. The loop range(1, 5) visits 1, 2, 3 and 4.",
  ],
  [
    "Data visualization",
    "Two datasets can have the same mean and very different distributions. A histogram reveals skewness and gaps.",
  ],
  [
    "Business management",
    "Revenue is measured before expenses. A business can increase sales volume and still earn less net profit.",
  ],
  [
    "Performing arts",
    "Tempo describes the speed of the beat. Dynamics describe how loudly or softly a passage is performed.",
  ],
  [
    "Artificial intelligence",
    "A language model can produce fluent text even when a factual claim is wrong. Always verify claims against primary sources.",
  ],
  [
    "Digital reputation",
    "Reach counts distinct people exposed to content. Impressions can count repeated views by the same person.",
  ],
  [
    "Calculus",
    "A positive first derivative means a function is increasing locally. Its magnitude measures how steeply it rises.",
  ],
  [
    "Business management",
    "Mintzberg grouped managerial work into ten roles across three categories: interpersonal, informational and decisional.",
  ],
  [
    "Programming",
    "In Python, standard division (/) always returns a float—even 8 / 2 produces 4.0—whereas // performs floor division.",
  ],
  [
    "Linear algebra",
    "A square matrix is invertible if and only if its determinant is non-zero, meaning its columns are linearly independent.",
  ],
  [
    "Business management",
    "SWOT separates internal Strengths and Weaknesses from external Opportunities and Threats before choosing strategy.",
  ],
  [
    "Artificial intelligence",
    "Zero-shot prompting specifies the goal, allowed labels and fallback rule without supplying worked training examples.",
  ],
  [
    "Programming",
    "A Python tuple is immutable after creation, making it safer for fixed records and valid as a dictionary key.",
  ],
  [
    "Data visualization",
    "Starting a bar chart’s numeric axis above zero visually exaggerates differences because readers compare bar lengths.",
  ],
  [
    "Business management",
    "Working capital equals current assets minus current liabilities—positive sales alone will not pay bills if cash is tied up.",
  ],
  [
    "Linear algebra",
    "Principal Component Analysis (PCA) projects high-dimensional data onto the eigenvectors with the largest eigenvalues.",
  ],
  [
    "Artificial intelligence",
    "Including post-outcome fields (like a cancellation date) in churn training causes data leakage and overstates model accuracy.",
  ],
  [
    "Programming",
    "A Python set automatically removes duplicate values and supports O(1) average-time membership checks with 'in'.",
  ],
  [
    "Digital reputation",
    "Earned media—independent reviews, news mentions and organic shares—builds trust differently from paid placements.",
  ],
  [
    "Business management",
    "Porter’s Five Forces evaluates industry attractiveness via rivalry, buyer power, supplier power, entrants and substitutes.",
  ],
  [
    "Calculus",
    "At a local extremum where a function is differentiable, the first derivative equals zero; the second derivative tests concavity.",
  ],
  [
    "Performing arts",
    "Blocking plans every performer’s stage positions and movement paths so sightlines and dramatic focus stay clear.",
  ],
  [
    "Business management",
    "STP stands for Segmentation, Targeting and Positioning—deciding whom to serve and what distinctive value to occupy in their mind.",
  ],
  [
    "Programming",
    "An Armstrong number equals the sum of its digits each raised to the power of the total digit count (e.g., 153 = 1³ + 5³ + 3³).",
  ],
  [
    "Data visualization",
    "Pairing direct series labels with distinct line patterns keeps charts readable for viewers with colour-vision differences.",
  ],
];

export function factsCard(root) {
  const grid = root.querySelector(".grid");
  if (!grid) return () => {};
  const card = document.createElement("aside");
  card.className = "fact-card";
  card.setAttribute("aria-label", "Subject study fact");
  card.innerHTML =
    '<div class="fact-head"><small>Subject facts · 20s cycle</small><span class="fact-count"></span></div>' +
    '<span class="fact-tag"></span>' +
    "<h3></h3><p></p>" +
    '<div class="fact-meter"><i class="fact-meter-fill"></i></div>' +
    '<div class="fact-actions"><button type="button" id="fact-pause">Pause</button><button type="button" id="fact-next">Next fact</button></div>';
  grid.children[2]?.after(card);

  let i = Math.floor(Math.random() * facts.length),
    paused = false,
    timer;
  const tagEl = card.querySelector(".fact-tag"),
    countEl = card.querySelector(".fact-count"),
    titleEl = card.querySelector("h3"),
    bodyEl = card.querySelector("p"),
    meterEl = card.querySelector(".fact-meter-fill"),
    pauseBtn = card.querySelector("#fact-pause"),
    nextBtn = card.querySelector("#fact-next");

  function resetMeter() {
    if (!meterEl) return;
    meterEl.style.animation = "none";
    void meterEl.offsetWidth;
    if (!paused) meterEl.style.animation = "fact-sweep 20s linear forwards";
  }

  function draw() {
    const [subj, text] = facts[i];
    tagEl.textContent = subj;
    countEl.textContent = i + 1 + " / " + facts.length;
    titleEl.textContent = subj;
    bodyEl.textContent = text;
    bodyEl.animate?.(
      [
        { opacity: 0.45, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 240, easing: "ease-out" },
    );
    resetMeter();
  }

  function next() {
    i = (i + 1) % facts.length;
    draw();
  }

  function schedule() {
    clearInterval(timer);
    if (!paused && !document.hidden) timer = setInterval(next, 20000);
    resetMeter();
  }

  pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    schedule();
  };
  nextBtn.onclick = () => {
    next();
    schedule();
  };
  document.addEventListener("visibilitychange", schedule);
  draw();
  schedule();

  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", schedule);
  };
}
