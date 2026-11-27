export function timedPractice(panel, course, selected, save, escape) {
  const e = escape;
  let index = 0;
  let correct = 0;
  const results = [];
  const seconds = selected.length * 45;
  panel.innerHTML = '<section class="reading"><h2>Timed practice</h2><p>' +
    selected.length + ' questions · ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, "0") +
    '</p><button type="button" class="primary">Start timer</button></section>';

  panel.querySelector("button").onclick = () => {
    const deadline = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      if (!panel.isConnected) { clearInterval(timer); return; }
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remaining === 0) { finish("Time’s up"); return; }
      panel.querySelector("output").textContent = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
    }, 250);

    function finish(title) {
      clearInterval(timer);
      panel.innerHTML = '<section class="reading"><h2>' + title + '</h2><p>' + correct + ' / ' + selected.length +
        ' correct · ' + (selected.length - results.length) + ' unanswered</p>' +
        results.map(({question, chosen, answer, why}) => '<details><summary>' + (chosen === answer ? "Correct" : "Review") +
          ' · ' + e(question) + '</summary><p>Your answer: ' + e(chosen) + '</p><p>Correct answer: ' + e(answer) + '. ' + e(why) + '</p></details>').join("") +
        '<p><a class="action" href="#' + course + '">Return to subject</a></p></section>';
    }

    function show() {
      if (index === selected.length) { finish("Practice results"); return; }
      const [questionId, [, question, answer, , why], answers] = selected[index];
      panel.innerHTML = '<section class="reading"><p>Question ' + (index + 1) + ' of ' + selected.length +
        ' · <output aria-label="Time remaining"></output></p><h2 tabindex="-1">' + e(question.split("\n")[0]) +
        '</h2>' + (question.includes("\n") ? '<pre><code>' + e(question.slice(question.indexOf("\n") + 1)) + '</code></pre>' : '') +
        '<form class="br-mock"><fieldset><legend>Choose an answer</legend>' +
        answers.map((option, n) => '<label><input name="answer" type="radio" value="' + n + '" required> ' + e(option) + '</label>').join("") +
        '</fieldset><button class="primary">Submit answer</button><button type="button" data-end>End practice</button></form></section>';
      panel.querySelector("h2").focus({preventScroll:true});
      panel.querySelector("[data-end]").onclick = () => finish("Practice results");
      panel.querySelector("form").onsubmit = event => {
        event.preventDefault();
        if (Date.now() >= deadline) { finish("Time’s up"); return; }
        const chosen = answers[Number(new FormData(event.target).get("answer"))];
        const right = chosen === answer;
        correct += Number(right);
        results.push({question, chosen, answer, why});
        void save("practice/" + course + "/" + questionId, right).catch(() => {});
        index++;
        show();
      };
    }
    show();
  };
}
