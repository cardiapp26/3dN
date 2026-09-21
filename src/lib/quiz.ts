import { CRANIAL_NERVES } from "./cranial-nerves";

export type QuizItem = {
  id: string;
  prompt: string;
  choices: string[];
  answer: number;
  explain: string;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildQuiz(): QuizItem[] {
  const items: QuizItem[] = [];

  for (const n of CRANIAL_NERVES) {
    const others = CRANIAL_NERVES.filter((x) => x.id !== n.id);
    const distractors = shuffle(others).slice(0, 3).map((x) => `CN ${x.roman} — ${x.nameTr}`);
    const correct = `CN ${n.roman} — ${n.nameTr}`;
    const choices = shuffle([correct, ...distractors]);
    items.push({
      id: `fn-${n.id}`,
      prompt: `Bu işlev hangi kafa çiftine aittir? “${n.functionShort}”`,
      choices,
      answer: choices.indexOf(correct),
      explain: `${n.nameLa}: ${n.functions[0]}`,
    });
  }

  const extras: QuizItem[] = [
    {
      id: "lr6",
      prompt: "Lateral rektus kasını innerve eden sinir hangisidir?",
      choices: ["CN III", "CN IV", "CN VI", "CN VII"],
      answer: 2,
      explain: "LR6 SO4: m. rectus lateralis abdusens (VI), m. obliquus superior troklear (IV).",
    },
    {
      id: "so4",
      prompt: "Tek dorsal çıkan kafa çifti hangisidir?",
      choices: ["CN III", "CN IV", "CN VI", "CN XII"],
      answer: 1,
      explain: "N. trochlearis orta beyin dorsalinden çıkar ve tamamen çaprazlaşır.",
    },
    {
      id: "bell",
      prompt: "Bell felcinde alın neden tutulur?",
      choices: [
        "Çünkü üst motor nörondur",
        "Çünkü alt motor nörondur, alın da ipsilateral innerve edilir",
        "Çünkü V3 motoru tutulur",
        "Çünkü Edinger–Westphal etkilenir",
      ],
      answer: 1,
      explain: "Santral fasiyal felçte alın korunur (bilateral kortikal innervasyon); Bell'de tüm hemifasiyal tutulur.",
    },
    {
      id: "gag",
      prompt: "Gag refleksinin afferent ve efferent ayakları?",
      choices: ["V ve VII", "IX ve X", "X ve XII", "VII ve IX"],
      answer: 1,
      explain: "Afferent: n. glossopharyngeus (IX). Efferent: n. vagus (X).",
    },
    {
      id: "uvula",
      prompt: "Tek taraflı vagus lezyonunda uvula nereye sapar?",
      choices: ["Felç tarafına", "Sağlam tarafa", "Daima sola", "Sapmaz"],
      answer: 1,
      explain: "Uvula sağlam tarafa sapar; dil ise felç tarafına (CN XII).",
    },
  ];

  return shuffle([...items, ...extras]).slice(0, 10);
}
