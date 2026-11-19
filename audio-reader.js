/* Browser-native read-aloud and dictation utilities.
 * No third-party TTS API, account keys, or generated content required.
 * Some browser-provided voices/recognition services may process speech online.
 */

const speechAvailable = typeof window !== 'undefined' &&
  'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let activeReader = null;

function normalize(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

// Short utterances avoid Chromium's long-utterance cutoff and improve pausing.
function chunksOf(input, limit = 175) {
  const text = normalize(input);
  if (!text) return [];
  const sentences = text.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/gu) || [text];
  const chunks = [];
  let buf = '';
  for (const sentence of sentences) {
    const words = normalize(sentence).split(' ');
    for (const word of words) {
      if (!word) continue;
      // Rare long unbroken tokens (e.g. a pasted URL).
      const parts = word.length > limit ? (word.match(new RegExp(`.{1,${limit}}`, 'g')) || []) : [word];
      for (const part of parts) {
        if (buf.length + part.length + 1 > limit && buf) {
          chunks.push(buf);
          buf = '';
        }
        buf = buf ? buf + ' ' + part : part;
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function readerPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem('boardroom_reader_v1') || '{}');
    return { speed: String(stored.speed || '1'), voice: String(stored.voice || '') };
  } catch {
    return { speed: '1', voice: '' };
  }
}
function saveReaderPreferences(speed, voice) {
  try { localStorage.setItem('boardroom_reader_v1', JSON.stringify({ speed, voice })); } catch { /* private browsing */ }
}

/** Mount a player into an existing element. Sources are functions returning live text. */
export function mountAudioReader(root, { sources, defaultSource, title = 'Listen to notes', description = '' }) {
  const entries = Object.entries(sources || {});
  if (!entries.length) return () => {};
  const prefs = readerPreferences();
  root.innerHTML = `<div class="audio-reader-head"><div><span class="eyebrow">✦ STUDY WITH YOUR EARS</span><h3>${title}</h3>${description ? `<p>${description}</p>` : ''}</div><span class="audio-icon" aria-hidden="true">♫</span></div>
    <div class="audio-reader-settings"><label>What to listen to<select class="audio-source"></select></label><label>Reading speed<select class="audio-speed"><option value="0.75">0.75× · Relaxed</option><option value="0.9">0.9× · Easy</option><option value="1">1× · Normal</option><option value="1.15">1.15× · Brisk</option><option value="1.4">1.4× · Fast</option><option value="1.7">1.7× · Revision</option></select></label><label>Voice<select class="audio-voice"><option value="">Device default</option></select></label></div>
    <div class="audio-reader-controls"><button type="button" class="primary audio-play">▶ Play audio</button><button type="button" class="audio-pause" disabled>⏸ Pause</button><button type="button" class="audio-stop" disabled>■ Stop</button></div>
    <progress class="audio-progress" value="0" max="100" aria-label="Audio reading progress"></progress>
    <p class="audio-now" aria-live="off">The spoken sentence will appear here as you listen.</p>
    <p class="audio-status" role="status" aria-live="polite">${speechAvailable ? 'Ready to read. Tap Play to begin.' : 'Text-to-speech is not available in this browser. You can still read and write notes.'}</p>`;
  const q = sel => root.querySelector(sel);
  const sourceEl = q('.audio-source'), speedEl = q('.audio-speed'), voiceEl = q('.audio-voice');
  const play = q('.audio-play'), pause = q('.audio-pause'), stopButton = q('.audio-stop');
  const progress = q('.audio-progress'), now = q('.audio-now'), status = q('.audio-status');
  for (const [key, data] of entries) {
    const option = document.createElement('option'); option.value = key; option.textContent = data.label; sourceEl.append(option);
  }
  sourceEl.value = entries.some(([key]) => key === defaultSource) ? defaultSource : entries[0][0];
  speedEl.value = Array.from(speedEl.options).some(o => o.value === prefs.speed) ? prefs.speed : '1';
  voiceEl.value = prefs.voice;
  let voices = [], parts = [], index = 0, playing = false, paused = false, generation = 0, destroyed = false;
  const updateControls = () => {
    play.disabled = !speechAvailable;
    pause.disabled = !playing;
    stopButton.disabled = !playing;
    play.textContent = playing ? '↻ Start again' : '▶ Play audio';
    pause.textContent = paused ? '▶ Resume' : '⏸ Pause';
  };
  const setStatus = (value) => { if (!destroyed && status.isConnected) status.textContent = value; };
  const fillVoices = () => {
    if (!speechAvailable || destroyed) return;
    const oldValue = voiceEl.value || prefs.voice;
    voices = window.speechSynthesis.getVoices().filter(v => /^en(?:-|$)/i.test(v.lang));
    voiceEl.replaceChildren(new Option('Device default', ''));
    for (const voice of voices) voiceEl.add(new Option(`${voice.name} (${voice.lang})`, voice.voiceURI));
    voiceEl.value = voices.some(v => v.voiceURI === oldValue) ? oldValue : '';
  };
  if (speechAvailable) {
    fillVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
  }
  function stop(silent = false) {
    ++generation;
    playing = false; paused = false; parts = []; index = 0;
    if (activeReader === controller) {
      activeReader = null;
      window.speechSynthesis.cancel();
    }
    if (!destroyed) {
      updateControls();
      if (!silent) { setStatus('Audio stopped.'); now.textContent = 'Choose a text source and press Play to listen again.'; progress.value = 0; }
    }
  }
  const controller = { stop };
  function speakNext(token) {
    if (!playing || destroyed || token !== generation) return;
    if (index >= parts.length) {
      const total = parts.length;
      stop(true);
      progress.value = 100;
      now.textContent = '✦ Finished reading. Nice work!';
      setStatus(`Finished listening to ${total} audio segments.`);
      return;
    }
    const segment = parts[index];
    const utterance = new SpeechSynthesisUtterance(segment);
    utterance.lang = 'en-IN';
    utterance.rate = Number(speedEl.value) || 1;
    const selected = voices.find(v => v.voiceURI === voiceEl.value);
    if (selected) { utterance.voice = selected; utterance.lang = selected.lang; }
    now.textContent = segment;
    progress.value = Math.round(100 * index / parts.length);
    setStatus(`Reading segment ${index + 1} of ${parts.length}.`);
    utterance.onend = () => {
      if (playing && token === generation) { index++; speakNext(token); }
    };
    utterance.onerror = event => {
      if (!playing || token !== generation || event.error === 'canceled' || event.error === 'interrupted') return;
      stop(true);
      setStatus('Audio playback failed on this device. Try another voice or use the written notes.');
    };
    try { window.speechSynthesis.speak(utterance); }
    catch { stop(true); setStatus('Audio playback could not start. Try another browser.'); }
  }
  function start(sourceKey) {
    if (!speechAvailable) { setStatus('Audio playback is not supported by this browser.'); return; }
    const key = sourceKey || sourceEl.value;
    const source = sources[key];
    const text = normalize(typeof source?.getText === 'function' ? source.getText() : '');
    if (!text) { setStatus('There is no text here yet. Write some notes or find an answer first.'); return; }
    if (activeReader && activeReader !== controller) activeReader.stop(true);
    stop(true);
    sourceEl.value = key;
    parts = chunksOf(text);
    if (!parts.length) { setStatus('Nothing to read aloud yet.'); return; }
    activeReader = controller;
    playing = true; paused = false; index = 0;
    updateControls();
    speakNext(generation);
  }
  play.addEventListener('click', () => start());
  pause.addEventListener('click', () => {
    if (!playing) return;
    if (paused) { window.speechSynthesis.resume(); paused = false; setStatus('Reading resumed.'); }
    else { window.speechSynthesis.pause(); paused = true; setStatus('Audio paused.'); }
    updateControls();
  });
  stopButton.addEventListener('click', () => stop());
  sourceEl.addEventListener('change', () => { if (playing) stop(); setStatus('Ready to read your selection.'); });
  for (const el of [speedEl, voiceEl]) el.addEventListener('change', () => {
    saveReaderPreferences(speedEl.value, voiceEl.value);
    if (playing) setStatus('Voice and speed changes apply from the next spoken segment.');
  });
  updateControls();
  const onLeave = () => stop(true);
  window.addEventListener('hashchange', onLeave, { once: true });
  return Object.assign(() => {
    stop(true); destroyed = true;
    window.removeEventListener('hashchange', onLeave);
    if (speechAvailable) window.speechSynthesis.removeEventListener?.('voiceschanged', fillVoices);
  }, { start, stop });
}

/** Bind optional Web Speech dictation to a textarea/input; transcript is user-editable. */
export function attachDictation(button, field, message) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  if (!SpeechRec) {
    button.disabled = true;
    button.title = 'Voice dictation needs a compatible browser and microphone permission';
    button.textContent = '🎙 Dictation unavailable';
    return () => {};
  }
  const defaultLabel = button.textContent;
  function halt() { if (rec) { const r = rec; rec = null; try { r.stop(); } catch {} } button.textContent = defaultLabel; button.classList.remove('mic-active'); }
  button.addEventListener('click', () => {
    if (rec) { halt(); return; }
    if (activeReader) activeReader.stop(true);
    try {
      const r = new SpeechRec(); rec = r;
      r.lang = 'en-IN'; r.interimResults = false; r.continuous = false;
      button.textContent = '■ Stop dictation'; button.classList.add('mic-active');
      message.textContent = 'Listening… The browser may send audio to its speech-recognition service.';
      r.onresult = event => {
        if (r !== rec) return;
        const words = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
        if (!words) return;
        const next = (field.value.trim() ? field.value.trim() + ' ' : '') + words;
        field.value = next.slice(0, field.maxLength > -1 ? field.maxLength : next.length);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        message.textContent = 'Dictation added. Review and edit before saving.';
      };
      r.onerror = event => {
        const reasons = { 'not-allowed': 'Microphone access denied', 'service-not-allowed': 'Speech service blocked', 'no-speech': 'No speech heard', network: 'Speech service offline' };
        message.textContent = (reasons[event.error] || 'Voice recognition error') + '. You can still type.';
        halt();
      };
      r.onend = () => { if (r === rec) halt(); };
      r.start();
    } catch { message.textContent = 'Microphone could not start. Try a different browser or type instead.'; halt(); }
  });
  const onLeave = () => halt();
  window.addEventListener('hashchange', onLeave, { once: true });
  return () => { halt(); window.removeEventListener('hashchange', onLeave); };
}
