import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  ShieldAlert,
  Smile,
  Sparkles,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BELL_PALSY_SAFETY,
  calculateFacialState,
  EVIDENCE_SOURCES,
  HOUSE_BRACKMANN_GRADES,
  HOUSE_BRACKMANN_NOTE,
  TOPODIAGNOSTIC_LEVELS,
  TREATMENT_PROTOCOL,
  type HouseBrackmannGrade,
  type MimicTest,
  type PalsyType,
} from "@/lib/bell-palsy";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import { FacialNerveAtlas } from "./FacialNerveAtlas";

type BellTab = "simulator" | "grading" | "topodiagnostics" | "protocol";

export function BellPalsyView() {
  const [activeTab, setActiveTab] = useState<BellTab>("simulator");
  const [palsyType, setPalsyType] = useState<PalsyType>("bell-left");
  const [mimicTest, setMimicTest] = useState<MimicTest>("wrinkle-forehead");
  const [selectedGrade, setSelectedGrade] = useState<HouseBrackmannGrade>(4);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("ganglion-geniculi");

  const setSelected = useStudio((s) => s.setSelected);
  const setMode = useStudio((s) => s.setMode);

  const facialState = calculateFacialState(palsyType, mimicTest);
  const gradeInfo = HOUSE_BRACKMANN_GRADES[selectedGrade];
  const levelInfo =
    TOPODIAGNOSTIC_LEVELS.find((l) => l.id === selectedLevelId) ?? TOPODIAGNOSTIC_LEVELS[1];

  function openFacialIn3D() {
    setSelected(7); // CN VII (N. facialis)
    setMode("innervation");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg p-4 md:p-6">
      {/* Başlık ve Üst Çubuk */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow tracking-widest text-gold">Klinik Nöroloji Modülü</span>
            <Badge tone="mixed">CN VII · N. Facialis</Badge>
          </div>
          <h1 className="latin mt-1 text-2xl font-semibold text-fg md:text-3xl">
            Bell Paralizisi{" "}
            <span className="text-muted text-lg font-normal">/ Paralysis Facialis</span>
          </h1>
          <p className="mt-1 text-xs text-muted md:text-sm">
            Akut fasiyal güçsüzlük paterni, güvenlik ağı, House-Brackmann evrelemesi ve kanıta
            dayalı ilk yaklaşım.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={openFacialIn3D}
            className="gap-2 border-gold/40 text-gold hover:bg-gold/10"
          >
            <Sparkles className="size-3.5" />
            <span>3D N. Facialis Yoluna Git</span>
          </Button>
        </div>
      </div>

      {/* Alt Sekmeler */}
      <nav
        aria-label="Bell paralizisi modül bölümleri"
        className="mb-6 flex flex-wrap gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]"
      >
        <button
          type="button"
          aria-pressed={activeTab === "simulator"}
          onClick={() => setActiveTab("simulator")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:text-sm",
            activeTab === "simulator"
              ? "bg-surface-2 text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <Smile className="size-4 text-gold" />
          <span>Fasiyal Patern & Tanı</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "grading"}
          onClick={() => setActiveTab("grading")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:text-sm",
            activeTab === "grading" ? "bg-surface-2 text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          <Activity className="size-4 text-gold" />
          <span>House-Brackmann Evreleri</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "topodiagnostics"}
          onClick={() => setActiveTab("topodiagnostics")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:text-sm",
            activeTab === "topodiagnostics"
              ? "bg-surface-2 text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <Stethoscope className="size-4 text-gold" />
          <span>Topodiagnostik Lokalizasyon</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "protocol"}
          onClick={() => setActiveTab("protocol")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:text-sm",
            activeTab === "protocol"
              ? "bg-surface-2 text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <ShieldAlert className="size-4 text-gold" />
          <span>Akut Tedavi & Göz Koruma</span>
        </button>
      </nav>

      {/* SEKME 1: YÜZ SİMÜLATÖRÜ & SANTRAL VS PERİFERİK */}
      {activeTab === "simulator" && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Sol Kolon: Simülatör Tuvali */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="eyebrow">İnteraktif CN VII Atlası</p>
                <h3 className="latin text-lg text-fg">{facialState.summaryHeading}</h3>
              </div>
              <Badge
                tone={
                  palsyType.startsWith("bell")
                    ? "motor"
                    : palsyType.startsWith("central")
                      ? "mixed"
                      : "sensory"
                }
              >
                {palsyType === "normal"
                  ? "Fizyolojik"
                  : palsyType.startsWith("bell")
                    ? "Periferik LMN"
                    : "Santral UMN"}
              </Badge>
            </div>

            {/* Kranial sinir atlasından CN VII görünümü */}
            <div className="mx-auto w-full max-w-[520px]">
              <FacialNerveAtlas state={facialState} palsy={palsyType} test={mimicTest} />
            </div>

            {/* Lezyon Tipi Seçimi */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                1. Klinik Durum Seçimi:
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Button
                  size="sm"
                  variant={palsyType === "normal" ? "default" : "outline"}
                  onClick={() => setPalsyType("normal")}
                  className="text-xs"
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  variant={palsyType === "bell-left" ? "default" : "outline"}
                  onClick={() => setPalsyType("bell-left")}
                  className={cn(
                    "text-xs",
                    palsyType === "bell-left" && "bg-amber-600 hover:bg-amber-700",
                  )}
                >
                  Sol Bell (Periferik)
                </Button>
                <Button
                  size="sm"
                  variant={palsyType === "bell-right" ? "default" : "outline"}
                  onClick={() => setPalsyType("bell-right")}
                  className={cn(
                    "text-xs",
                    palsyType === "bell-right" && "bg-amber-600 hover:bg-amber-700",
                  )}
                >
                  Sağ Bell (Periferik)
                </Button>
                <Button
                  size="sm"
                  variant={palsyType === "central-left" ? "default" : "outline"}
                  onClick={() => setPalsyType("central-left")}
                  className={cn(
                    "text-xs",
                    palsyType === "central-left" && "bg-rose-700 hover:bg-rose-800",
                  )}
                >
                  Sol Santral Patern
                </Button>
                <Button
                  size="sm"
                  variant={palsyType === "central-right" ? "default" : "outline"}
                  onClick={() => setPalsyType("central-right")}
                  className={cn(
                    "text-xs",
                    palsyType === "central-right" && "bg-rose-700 hover:bg-rose-800",
                  )}
                >
                  Sağ Santral Patern
                </Button>
              </div>
            </div>

            {/* Mimik Testi Seçimi */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                2. Test Edilen Mimik Fonksiyonu:
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  size="sm"
                  variant={mimicTest === "wrinkle-forehead" ? "secondary" : "ghost"}
                  onClick={() => setMimicTest("wrinkle-forehead")}
                  className={cn(
                    "h-auto min-h-8 justify-start gap-2 whitespace-normal border border-border text-xs",
                    mimicTest === "wrinkle-forehead" && "border-gold text-gold",
                  )}
                >
                  <span className="font-semibold">Alın Kırıştırma</span>
                  <span className="text-[10px] text-muted">(M. frontalis)</span>
                </Button>
                <Button
                  size="sm"
                  variant={mimicTest === "close-eyes" ? "secondary" : "ghost"}
                  onClick={() => setMimicTest("close-eyes")}
                  className={cn(
                    "h-auto min-h-8 justify-start gap-2 whitespace-normal border border-border text-xs",
                    mimicTest === "close-eyes" && "border-gold text-gold",
                  )}
                >
                  <span className="font-semibold">Göz Kapatma</span>
                  <span className="text-[10px] text-muted">(M. orbicularis oculi)</span>
                </Button>
                <Button
                  size="sm"
                  variant={mimicTest === "smile" ? "secondary" : "ghost"}
                  onClick={() => setMimicTest("smile")}
                  className={cn(
                    "h-auto min-h-8 justify-start gap-2 whitespace-normal border border-border text-xs",
                    mimicTest === "smile" && "border-gold text-gold",
                  )}
                >
                  <span className="font-semibold">Gülümseme</span>
                  <span className="text-[10px] text-muted">(M. zygomaticus)</span>
                </Button>
                <Button
                  size="sm"
                  variant={mimicTest === "puff-cheeks" ? "secondary" : "ghost"}
                  onClick={() => setMimicTest("puff-cheeks")}
                  className={cn(
                    "h-auto min-h-8 justify-start gap-2 whitespace-normal border border-border text-xs",
                    mimicTest === "puff-cheeks" && "border-gold text-gold",
                  )}
                >
                  <span className="font-semibold">Yanak Şişirme</span>
                  <span className="text-[10px] text-muted">(M. buccinator)</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Klinik ve Anatomik Açıklama */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="size-4" />
                <h4 className="text-balance font-display text-base font-semibold">
                  Önce Acili Dışla
                </h4>
              </div>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-fg/90">
                Ani yüz güçsüzlüğü inme belirtisi olabilir. Kol-bacak güçsüzlüğü, konuşma bozukluğu,
                çift görme, belirgin dengesizlik veya yeni şiddetli baş ağrısı varsa acil
                değerlendirme gerekir.
              </p>
            </div>

            {/* Canlı Test Bulgusu */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-gold">
                <Info className="size-4" />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Muayene Bulgusu</h4>
              </div>
              <p className="mt-2 text-base font-medium text-fg">{facialState.clinicalNote}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-fg">Nöroanatomik Mekanizma: </span>
                {facialState.anatomicalBasis}
              </p>
            </div>

            {/* Santral ve periferik patern ayrımı */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="size-4.5" />
                <h4 className="font-display text-base font-semibold">
                  Lokalizasyon İpucu, Tanı Kuralı Değil
                </h4>
              </div>
              <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted">
                <div className="rounded-lg bg-surface/80 p-3">
                  <p className="font-semibold text-fg">Periferik Felç (Bell Paralizisi / LMN):</p>
                  <p className="mt-0.5">
                    N. facialis ana gövdesi veya nükleusu hasar gördüğü için{" "}
                    <span className="font-semibold text-amber-300">
                      alın dahil tüm hemifasiyal kaslar
                    </span>{" "}
                    felçtir. Hasta kaşını kaldıramaz, alnını kırıştıramaz ve gözünü kapatamaz (Bell
                    fenomeni).
                  </p>
                </div>
                <div className="rounded-lg bg-surface/80 p-3">
                  <p className="font-semibold text-fg">Santral Felç (İnme / UMN):</p>
                  <p className="mt-0.5">
                    Fasiyal motor çekirdeğin üst yüz (alın) temsil alanı{" "}
                    <span className="font-semibold text-emerald-400">
                      her iki serebral hemisferden (bilateral kortikobulbar yol)
                    </span>{" "}
                    lif alır. Bu nedenle tek taraflı kortikal lezyonda karşı taraf alın kırıştırma
                    ve göz kapama korunur; felç yalnızca alt yüze sınırlıdır.
                  </p>
                </div>
                <p className="text-pretty font-medium text-amber-200">
                  {BELL_PALSY_SAFETY.patternWarning}
                </p>
              </div>
            </div>

            {/* Bell Fenomeni Kutusu */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-fg">
                <Eye className="size-4 text-gold" />
                <h4 className="font-display text-base font-semibold">Bell Fenomeni Nedir?</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Kişi gözlerini kapatmaya çalıştığında göz küresinin istemsiz olarak yukarı ve dışa
                doğru dönmesi fizyolojik bir savunma refleksidir. Normal kişilerde göz kapağı
                kapandığı için bu hareket görülmez. Bell paralizisinde <i>m. orbicularis oculi</i>{" "}
                felcine bağlı göz açık kaldığından (lagoftalmi), skleranın beyaz kısmı dramatik
                şekilde görünür hale gelir.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SEKME 2: HOUSE-BRACKMANN EVRELEME SKORU */}
      {activeTab === "grading" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4 text-pretty text-xs leading-relaxed text-muted">
            <span className="font-semibold text-fg">Ölçeğin sınırı: </span>
            {HOUSE_BRACKMANN_NOTE}
          </div>
          {/* Evre Seçici Düğmeler */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {([1, 2, 3, 4, 5, 6] as HouseBrackmannGrade[]).map((grade) => {
              const item = HOUSE_BRACKMANN_GRADES[grade];
              const isSelected = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedGrade(grade)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-gold bg-gold/10 shadow-[0_0_15px_rgba(200,160,80,0.15)]"
                      : "border-border bg-surface hover:bg-surface-2",
                  )}
                >
                  <span className="font-display text-2xl font-bold text-gold">{item.roman}</span>
                  <span className="mt-1 text-xs font-semibold text-fg">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] text-muted">{item.summary}</span>
                </button>
              );
            })}
          </div>

          {/* Seçili Evrenin Detay Paneli */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={selectedGrade <= 2 ? "sensory" : selectedGrade <= 4 ? "mixed" : "motor"}
                  >
                    Evre {gradeInfo.roman}
                  </Badge>
                  <span className="latin text-xs text-muted">{gradeInfo.latinTitle}</span>
                </div>
                <h3 className="latin mt-1 text-2xl font-semibold text-fg">{gradeInfo.title}</h3>
                <p className="mt-1 text-sm text-muted">{gradeInfo.summary}</p>
              </div>
              <div className="max-w-sm rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
                <p className="eyebrow text-gold">Klinik Odak</p>
                <p className="mt-1 text-pretty text-xs font-medium leading-relaxed text-fg">
                  {gradeInfo.clinicalFocus}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-bg/50 p-4">
                <p className="eyebrow text-gold">İstirahat Tonusu</p>
                <p className="mt-2 text-sm text-fg">{gradeInfo.rest}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-4">
                <p className="eyebrow text-gold">Alın Hareketi</p>
                <p className="mt-2 text-sm text-fg">{gradeInfo.forehead}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-4">
                <p className="eyebrow text-gold">Göz Kapanması (Lagoftalmi)</p>
                <p className="mt-2 text-sm text-fg">{gradeInfo.eye}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-4">
                <p className="eyebrow text-gold">Ağız Hareketi</p>
                <p className="mt-2 text-sm text-fg">{gradeInfo.mouth}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-4">
                <p className="eyebrow text-gold">Sinkinezi & Spazm</p>
                <p className="mt-2 text-sm text-fg">{gradeInfo.synkinesis}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-4">
                <p className="eyebrow text-gold">Evreleme Notu</p>
                <p className="mt-2 text-pretty text-sm text-fg">
                  Prognoz; başlangıç şiddeti yanında yaş, etiyoloji, komorbiditeler ve seri
                  muayeneye bağlıdır.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEKME 3: TOPODİAGNOSTİK LOKALİZASYON */}
      {activeTab === "topodiagnostics" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted">
            <span className="font-semibold text-fg">Topodiagnostik İlke: </span>
            Canalis facialis boyunca ayrılan dalların bulguları anatomik seviyeyi destekleyebilir;
            tek bir test lokalizasyonu kesinleştirmez.
          </div>

          {/* Seviye Seçim Şeridi */}
          <div className="flex flex-col gap-2 md:flex-row">
            {TOPODIAGNOSTIC_LEVELS.map((level) => {
              const isSelected = selectedLevelId === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedLevelId(level.id)}
                  className={cn(
                    "flex flex-1 flex-col rounded-xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-gold bg-gold/10 shadow-sm"
                      : "border-border bg-surface hover:bg-surface-2",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-gold">
                      Seviye {level.order}
                    </span>
                  </div>
                  <span className="mt-1 line-clamp-1 text-xs font-semibold text-fg">
                    {level.nameTr}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Seçili Seviyenin Teşhis Matrisi */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="border-b border-border pb-4">
              <span className="eyebrow text-gold">
                Seviye {levelInfo.order} · Anatomik Lokalizasyon
              </span>
              <h3 className="latin text-2xl font-semibold text-fg">{levelInfo.nameTr}</h3>
              <p className="latin text-xs text-muted">{levelInfo.nameLa}</p>
              <p className="mt-2 text-xs text-fg/80">
                <span className="font-semibold text-gold">Konum: </span>
                {levelInfo.anatomicalSite}
              </p>
            </div>

            {/* Tanısal Testler Matrisi */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Schirmer Testi */}
              <div className="rounded-xl border border-border bg-bg/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Schirmer (Lakrimasyon)
                  </span>
                  {levelInfo.lacrimation.intact ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <XCircle className="size-4 text-rose-500" />
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-fg">
                  {levelInfo.lacrimation.intact ? "Gözyaşı Korunmuş" : "Kuru Göz (Bozuk)"}
                </p>
                <p className="mt-1 text-xs text-muted">{levelInfo.lacrimation.finding}</p>
              </div>

              {/* Akustik Stapedius Refleksi */}
              <div className="rounded-xl border border-border bg-bg/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Stapedius (Hiperakuzi)
                  </span>
                  {levelInfo.stapedius.intact ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <XCircle className="size-4 text-rose-500" />
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-fg">
                  {levelInfo.stapedius.intact
                    ? "Stapedius Dalı Korunmuş"
                    : "Stapedius Dalı Etkilenmiş"}
                </p>
                <p className="mt-1 text-xs text-muted">{levelInfo.stapedius.finding}</p>
              </div>

              {/* Tat Duyusu */}
              <div className="rounded-xl border border-border bg-bg/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Tat (Dil Ön 2/3)
                  </span>
                  {levelInfo.taste.intact ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <XCircle className="size-4 text-rose-500" />
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-fg">
                  {levelInfo.taste.intact ? "Tat Duyusu Sağlam" : "Tat Kaybı / Disgeuzi"}
                </p>
                <p className="mt-1 text-xs text-muted">{levelInfo.taste.finding}</p>
              </div>

              {/* Motor Mimik */}
              <div className="rounded-xl border border-border bg-bg/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted">Mimik Kasları</span>
                  <XCircle className="size-4 text-rose-500" />
                </div>
                <p className="mt-2 text-sm font-semibold text-fg">Fasiyal Felç</p>
                <p className="mt-1 text-xs text-muted">{levelInfo.motor.finding}</p>
              </div>
            </div>

            {/* Eşlik Eden Bulgular & Klinik İnci */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface-2/60 p-4">
                <p className="eyebrow text-gold">Eşlik Eden Klinik Bulgular</p>
                <p className="mt-1 text-xs leading-relaxed text-fg/90">
                  {levelInfo.associatedFindings}
                </p>
              </div>
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <p className="eyebrow text-gold">Klinik İnci (Diagnostic Pearl)</p>
                <p className="mt-1 text-xs leading-relaxed text-fg/90">{levelInfo.pearl}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEKME 4: AKUT TEDAVİ & GÖZ KORUMA PROTOKOLÜ */}
      {activeTab === "protocol" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="size-4" />
                <h3 className="text-balance font-display text-base font-semibold">
                  Acil Alarm Bulguları
                </h3>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-pretty text-xs leading-relaxed text-fg/90">
                {BELL_PALSY_SAFETY.emergencySigns.map((sign) => (
                  <li key={sign}>{sign}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="size-4" />
                <h3 className="text-balance font-display text-base font-semibold">Atipik Seyir</h3>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-pretty text-xs leading-relaxed text-fg/90">
                {BELL_PALSY_SAFETY.atypicalFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kritik Pencere Uyarısı */}
          <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <Clock className="mt-0.5 size-5 shrink-0 text-gold" />
            <div>
              <h4 className="font-semibold text-fg">Kritik Terapötik Pencere: İlk 72 Saat</h4>
              <p className="mt-1 text-xs text-muted">{TREATMENT_PROTOCOL.therapeuticWindow}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Medikal Tedavi Protokolü */}
            <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Stethoscope className="size-4.5 text-gold" />
                <h3 className="text-balance font-display text-lg font-semibold text-fg">
                  Kanıta Dayalı Farmakolojik Yaklaşım
                </h3>
              </div>

              {/* Kortikosteroid */}
              <div className="rounded-lg border border-border bg-bg/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-fg">
                    {TREATMENT_PROTOCOL.corticosteroids.name}
                  </span>
                  <Badge tone="mixed">Güçlü Öneri</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted">
                  <p>
                    <span className="font-medium text-fg">Doz: </span>
                    {TREATMENT_PROTOCOL.corticosteroids.dose}
                  </p>
                  <p>
                    <span className="font-medium text-fg">Kullanım: </span>
                    {TREATMENT_PROTOCOL.corticosteroids.duration}
                  </p>
                  <p className="mt-1 text-fg/80">{TREATMENT_PROTOCOL.corticosteroids.evidence}</p>
                  <p className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-100/80">
                    {TREATMENT_PROTOCOL.corticosteroids.cautions}
                  </p>
                </div>
              </div>

              {/* Antiviral */}
              <div className="rounded-lg border border-border bg-bg/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-fg">
                    {TREATMENT_PROTOCOL.antivirals.name}
                  </span>
                  <Badge tone="sensory">İsteğe Bağlı Ek</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted">
                  <p>
                    <span className="font-medium text-fg">Rejim: </span>
                    {TREATMENT_PROTOCOL.antivirals.regimen}
                  </p>
                  <p>
                    <span className="font-medium text-fg">Endikasyon: </span>
                    {TREATMENT_PROTOCOL.antivirals.indications}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {TREATMENT_PROTOCOL.antivirals.notes}
                  </p>
                  <p className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-100/80">
                    {TREATMENT_PROTOCOL.antivirals.cautions}
                  </p>
                </div>
              </div>
            </div>

            {/* Kornea koruma planı */}
            <div className="space-y-4 rounded-xl border border-rose-500/30 bg-surface p-5">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-rose-400">
                <Eye className="size-4.5" />
                <h3 className="text-balance font-display text-lg font-semibold text-fg">
                  {TREATMENT_PROTOCOL.eyeProtection.title}
                </h3>
              </div>
              <p className="text-xs text-muted">{TREATMENT_PROTOCOL.eyeProtection.subheading}</p>

              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-bg/60 p-3">
                  <p className="font-semibold text-xs text-gold">Gündüz Rejimi</p>
                  <p className="mt-1 text-xs text-fg/90">
                    {TREATMENT_PROTOCOL.eyeProtection.daytime}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-bg/60 p-3">
                  <p className="font-semibold text-xs text-gold">Gece Rejimi</p>
                  <p className="mt-1 text-xs text-fg/90">
                    {TREATMENT_PROTOCOL.eyeProtection.nighttime}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-bg/60 p-3">
                  <p className="font-semibold text-xs text-fg">Alınacak Ek Önlemler</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted">
                    {TREATMENT_PROTOCOL.eyeProtection.measures.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Geç Komplikasyonlar */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-balance font-display text-base font-semibold text-fg">
                Geç Dönem Sekelleri ve Aberran Rejenerasyon
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {TREATMENT_PROTOCOL.complications.map((c) => (
                  <div key={c.name} className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-xs font-semibold text-gold">{c.name}</p>
                    <p className="mt-1 text-pretty text-[11px] leading-relaxed text-muted">
                      {c.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-balance font-display text-base font-semibold text-fg">
                İzlem Eşikleri
              </h4>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-pretty text-xs leading-relaxed text-muted">
                {TREATMENT_PROTOCOL.followUp.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-pretty text-xs font-medium text-fg">
              {BELL_PALSY_SAFETY.disclaimer}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {EVIDENCE_SOURCES.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gold underline-offset-4 hover:underline"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
