"use strict";

/* ---------- 1. Datos ---------- */
const CONSONANTS = ["b", "k", "d", "g", "h", "l", "m", "n", "ng", "p", "r", "s", "t", "w", "y"];
const VOWELS = ["a", "e", "i", "o", "u"];

// [salita, larawan, pantig]
const WORDS = [
  { text: "aso",      emoji: "🐶", syllables: ["a", "so"] },
  { text: "pusa",     emoji: "🐱", syllables: ["pu", "sa"] },
  { text: "bola",     emoji: "⚽", syllables: ["bo", "la"] },
  { text: "bata",     emoji: "🧒", syllables: ["ba", "ta"] },
  { text: "baka",     emoji: "🐄", syllables: ["ba", "ka"] },
  { text: "bahay",    emoji: "🏠", syllables: ["ba", "hay"] },
  { text: "araw",     emoji: "☀️", syllables: ["a", "raw"] },
  { text: "buwan",    emoji: "🌙", syllables: ["bu", "wan"] },
  { text: "isda",     emoji: "🐟", syllables: ["is", "da"] },
  { text: "lobo",     emoji: "🎈", syllables: ["lo", "bo"] },
  { text: "saging",   emoji: "🍌", syllables: ["sa", "ging"] },
  { text: "tubig",    emoji: "💧", syllables: ["tu", "big"] },
  { text: "puso",     emoji: "❤️", syllables: ["pu", "so"] },
  { text: "bibe",     emoji: "🦆", syllables: ["bi", "be"] },
  { text: "kamay",    emoji: "✋", syllables: ["ka", "may"] },
  { text: "mata",     emoji: "👀", syllables: ["ma", "ta"] },
  { text: "manok",    emoji: "🐔", syllables: ["ma", "nok"] },
  { text: "bulaklak", emoji: "🌸", syllables: ["bu", "lak", "lak"] },
  { text: "mesa",     emoji: "🪑", syllables: ["me", "sa"] },
  { text: "sapatos",  emoji: "👟", syllables: ["sa", "pa", "tos"] },
];

/* ---------- 2. Boses (Text-to-Speech) ---------- */
const speech = {
  voice: null,

  // Humanap ng boses na Filipino/Tagalog
  loadVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices();
    this.voice =
      voices.find((v) => /^fil/i.test(v.lang)) ||
      voices.find((v) => /^tl/i.test(v.lang)) ||
      null;

    $("voice-note").textContent = this.voice
      ? ""
      : "Paalala: kung walang boses na Filipino ang device, gagamit ito ng ibang boses.";
  },

  // Bigkasin ang teksto; tatawagin ang onDone pagkatapos
  say(text, onDone) {
    if (!("speechSynthesis" in window)) {
      if (onDone) onDone();
      return;
    }
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.voice ? this.voice.lang : "fil-PH";
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = 0.7;   // mabagal para madaling sundan
    utterance.pitch = 1.15;
    if (onDone) utterance.onend = onDone;

    speechSynthesis.speak(utterance);
  },
};

/* ---------- 3. Helpers ---------- */
function $(id) {
  return document.getElementById(id);
}

function makeButton(className, text, onClick) {
  const button = document.createElement("button");
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

/* ---------- 4. Tabs ---------- */
function setupTabs() {
  const tabs = document.querySelectorAll(".tabs__btn");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.hidden = panel.id !== tab.dataset.tab;
      });
      if (tab.dataset.tab === "laro") game.nextQuestion();
    });
  });
}

/* ---------- 5. Pantig ---------- */
const syllables = {
  init() {
    this.showVowels();

    CONSONANTS.forEach((c) => {
      const chip = makeButton("chip", c, () => this.show(c));
      chip.setAttribute("aria-pressed", "false");
      $("consonants").appendChild(chip);
    });
    this.show("b");
  },

  // A E I O U — nasa simula ng seksyon
  showVowels() {
    const row = $("vowels");
    if (!row) return; // kung luma pa ang index.html, huwag ihinto ang buong app

    VOWELS.forEach((vowel) => {
      const button = makeButton("syllable", vowel.toUpperCase(), () => {
        button.classList.add("is-active");
        setTimeout(() => button.classList.remove("is-active"), 300);
        speech.say(vowel);
      });
      row.appendChild(button);
    });
  },

  show(consonant) {
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.textContent === consonant));
    });

    const row = $("syllables");
    row.innerHTML = "";

    VOWELS.forEach((vowel) => {
      const sound = consonant + vowel;
      const button = makeButton("syllable", sound, () => {
        button.classList.add("is-active");
        setTimeout(() => button.classList.remove("is-active"), 300);
        speech.say(sound);
      });
      row.appendChild(button);
    });
  },
};

/* ---------- 6. Salita ---------- */
const reader = {
  index: 0,

  init() {
    $("word-picture").addEventListener("click", () => speech.say(this.current.text));
    $("btn-prev").addEventListener("click", () => this.move(-1));
    $("btn-next").addEventListener("click", () => this.move(1));
    $("btn-read").addEventListener("click", () => this.readAloud());
    this.show();
  },

  get current() {
    return WORDS[this.index];
  },

  move(step) {
    this.index = (this.index + step + WORDS.length) % WORDS.length;
    this.show();
  },

  show() {
    $("word-picture").textContent = this.current.emoji;

    const row = $("word-syllables");
    row.innerHTML = "";
    this.current.syllables.forEach((s) => {
      row.appendChild(makeButton("syllable", s, () => speech.say(s)));
    });
  },

  // Basahin ang bawat pantig, saka ang buong salita
  readAloud() {
    const buttons = [...$("word-syllables").children];
    let i = 0;

    const next = () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      if (i >= buttons.length) {
        speech.say(this.current.text);
        return;
      }
      const button = buttons[i++];
      button.classList.add("is-active");
      speech.say(button.textContent, () => setTimeout(next, 150));
    };

    next();
  },
};

/* ---------- 7. Laro ---------- */
const game = {
  answer: null,
  score: 0,
  locked: false,

  init() {
    $("btn-hear").addEventListener("click", () => speech.say(this.answer.text));
  },

  nextQuestion() {
    this.locked = false;
    $("feedback").textContent = "";

    const options = shuffle(WORDS).slice(0, 3);
    this.answer = options[Math.floor(Math.random() * options.length)];

    const box = $("choices");
    box.innerHTML = "";
    options.forEach((word) => {
      const choice = makeButton("choice", word.emoji, () => this.check(word, choice));
      choice.setAttribute("aria-label", word.text);
      box.appendChild(choice);
    });

    setTimeout(() => speech.say(this.answer.text), 300);
  },

  check(word, button) {
    if (this.locked) return;

    if (word === this.answer) {
      this.locked = true;
      button.classList.add("is-correct");
      this.score++;
      $("score").textContent = this.score;
      $("feedback").textContent = "Tama! Galing! 🎉";
      speech.say(this.answer.text);
      setTimeout(() => this.nextQuestion(), 2200);
    } else {
      button.classList.add("is-wrong");
      $("feedback").textContent = "Subukan ulit!";
      speech.say("Subukan ulit");
    }
  },
};

/* ---------- 8. Simula ---------- */
function start() {
  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = () => speech.loadVoice();
    speech.loadVoice();
  }
  setupTabs();
  syllables.init();
  reader.init();
  game.init();
}

start();
