import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
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
  EVIDENCE_SOURCES,
  HOUSE_BRACKMANN_GRADES,
  HOUSE_BRACKMANN_NOTE,
  TOPODIAGNOSTIC_LEVELS,
  TREATMENT_PROTOCOL,
  type HouseBrackmannGrade,
} from "@/lib/bell-palsy";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import { PatternTab } from "./bell/PatternTab";

type BellTab = "pattern" | "grading" | "topodiagnostics" | "protocol";

const TABS: { id: BellTab; label: string; long: string; icon: typeof Smile }[] = [
  { id: "pattern", label: "Patern", long: "Fasiyal patern ve tanı", icon: Smile },
  { id: "grading", label: "Evreleme", long: "House-Brackmann evreleri", icon: Activity },
  {
    id: "topodiagnostics",
    label: "Lokalizasyon",
    long: "Topodiagnostik lokalizasyon",
    icon: Stethoscope,
  },
  { id: "protocol", label: "Tedavi", long: "Akut tedavi ve göz koruma", icon: ShieldAlert },
];

/** Clinical module for CN VII: one question per tab, the rest folded away. */
export function BellPalsyView() {
  const [activeTab, setActiveTab] = useState<BellTab>("pattern");
  const [selectedGrade, setSelectedGrade] = useState<HouseBrackmannGrade>(4);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("ganglion-geniculi");

  const setSelected = useStudio((s) => s.setSelected);
  const setMode = useStudio((s) => s.setMode);

  const gradeInfo = HOUSE_BRACKMANN_GRADES[selectedGrade];
  const levelInfo =
    TOPODIAGNOSTIC_LEVELS.find((l) => l.id === selectedLevelId) ?? TOPODIAGNOSTIC_LEVELS[1];

  return (
    <div className="scroll-thin flex h-full flex-col overflow-y-auto bg-bg">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border px-4 pb-4 pt-5 md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="eyebrow text-gold">Klinik modül</p>
            <Badge tone="mixed">CN VII</Badge>
          </div>
          <h1 className="latin mt-1 text-3xl leading-none text-fg">Paralysis facialis</h1>
          <p className="mt-1 text-sm text-muted">
            Bell paralizisi: patern, evreleme, lokalizasyon ve ilk 72 saat.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelected(7);
            setMode("innervation");
          }}
          className="gap-2 border-gold/40 text-gold hover:bg-gold/10"
        >
          <Sparkles className="size-3.5" />
          <span>3D n. facialis</span>
        </Button>
      </header>

      <nav
        aria-label="Bell paralizisi bölümleri"
        className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-border px-4 py-2 md:px-6"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              title={tab.long}
              aria-pressed={active}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors duration-[var(--motion-quick)]",
                active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <Icon className={cn("size-4", active && "text-gold")} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 md:p-6">
        {activeTab === "pattern" && <PatternTab />}

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
    </div>
  );
}
