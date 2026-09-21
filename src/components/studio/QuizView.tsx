import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildQuiz, type QuizItem } from "@/lib/quiz";
import { cn } from "@/lib/utils";

export function QuizView() {
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setQuestions(buildQuiz());
  }, []);

  const q = questions[index];

  function choose(i: number) {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  if (questions.length === 0) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted">Sorular hazırlanıyor</div>
    );
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Sınav bitti</p>
        <p className="font-display text-4xl tabular-nums text-fg">
          {score}/{questions.length}
        </p>
        <p className="max-w-md text-sm text-muted">
          {score >= 8
            ? "Kafa çiftleri yerleşmiş. Klinik inci maddelerini 3D sahnede bir kez daha izleyin."
            : "Atlas levhalarına ve innervasyon listesine dönüp zayıf kaldığınız çiftleri tekrar edin."}
        </p>
        <Button
          onClick={() => {
            setQuestions(buildQuiz());
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
        >
          Yeniden başla
        </Button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center gap-6 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">
        Soru {index + 1} / {questions.length} · skor {score}
      </p>
      <h2 className="font-display text-2xl text-fg">{q.prompt}</h2>
      <div className="grid gap-2">
        {q.choices.map((c, i) => {
          const revealed = picked !== null;
          const correct = i === q.answer;
          return (
            <button
              key={c}
              type="button"
              onClick={() => choose(i)}
              className={cn(
                "min-h-12 rounded-lg px-4 py-3 text-left text-sm shadow-[var(--shadow-border)] transition-colors duration-[var(--motion-quick)]",
                revealed && correct && "bg-mixed/20 text-fg",
                revealed && picked === i && !correct && "bg-motor/20 text-fg",
                !revealed && "bg-surface text-fg hover:bg-surface-2",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="panel-enter space-y-3">
          <p className="text-sm text-muted">{q.explain}</p>
          <Button onClick={next}>{index + 1 >= questions.length ? "Sonuç" : "Sonraki"}</Button>
        </div>
      )}
    </div>
  );
}
