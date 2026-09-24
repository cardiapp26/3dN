import { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BELL_PALSY_SAFETY,
  calculateFacialState,
  type MimicTest,
  type PalsyType,
} from "@/lib/bell-palsy";
import { FacialNerveAtlas } from "../FacialNerveAtlas";
import { FaceSchematic } from "./FaceSchematic";
import { PathwaySchematic } from "./PathwaySchematic";
import { Callout, Chip, Disclosure, Panel } from "./ui";

const PALSY_OPTIONS: { id: PalsyType; label: string; caption: string }[] = [
  { id: "normal", label: "Normal", caption: "Fizyolojik" },
  { id: "bell-left", label: "Bell, sol", caption: "Periferik, LMN" },
  { id: "bell-right", label: "Bell, sağ", caption: "Periferik, LMN" },
  { id: "central-left", label: "Santral, sol", caption: "İnme paterni, UMN" },
  { id: "central-right", label: "Santral, sağ", caption: "İnme paterni, UMN" },
];

const MIMIC_OPTIONS: { id: MimicTest; label: string; caption: string }[] = [
  { id: "wrinkle-forehead", label: "Alın kırıştır", caption: "M. frontalis" },
  { id: "close-eyes", label: "Göz kapat", caption: "M. orbicularis oculi" },
  { id: "smile", label: "Gülümse", caption: "M. zygomaticus" },
  { id: "puff-cheeks", label: "Yanak şişir", caption: "M. buccinator" },
];

/** Pick a lesion, pick a movement, read one finding. Everything else folds away. */
export function PatternTab() {
  const [palsy, setPalsy] = useState<PalsyType>("bell-left");
  const [mimic, setMimic] = useState<MimicTest>("wrinkle-forehead");

  const state = calculateFacialState(palsy, mimic);
  const isCentral = palsy.startsWith("central");
  const isBell = palsy.startsWith("bell");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <p className="eyebrow">1. Lezyon</p>
          <div className="flex flex-wrap gap-1.5">
            {PALSY_OPTIONS.map((o) => (
              <Chip
                key={o.id}
                active={palsy === o.id}
                onClick={() => setPalsy(o.id)}
                label={o.label}
                caption={o.caption}
                tone={o.id.startsWith("central") ? "info" : o.id === "normal" ? "plain" : "danger"}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="eyebrow">2. Muayene hareketi</p>
          <div className="flex flex-wrap gap-1.5">
            {MIMIC_OPTIONS.map((o) => (
              <Chip
                key={o.id}
                active={mimic === o.id}
                onClick={() => setMimic(o.id)}
                label={o.label}
                caption={o.caption}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Hastanın yüzü</p>
              <h3 className="latin mt-0.5 text-base leading-tight text-fg">
                {state.summaryHeading}
              </h3>
            </div>
            <Badge tone={isBell ? "motor" : isCentral ? "sensory" : "mixed"}>
              {isBell ? "Periferik LMN" : isCentral ? "Santral UMN" : "Fizyolojik"}
            </Badge>
          </div>
          <FaceSchematic state={state} palsy={palsy} test={mimic} />
        </div>

        <Disclosure title="Anatomik atlas levhası (n. facialis dalları)">
          <FacialNerveAtlas state={state} palsy={palsy} test={mimic} />
        </Disclosure>
      </div>

      <div className="flex flex-col gap-3">
        <Panel eyebrow="Muayene bulgusu">
          <p className="text-base leading-snug text-fg">{state.clinicalNote}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-fg">Mekanizma. </span>
            {state.anatomicalBasis}
          </p>
        </Panel>

        <div className="space-y-2">
          <p className="eyebrow">Alın neden korunur?</p>
          <PathwaySchematic palsy={palsy} />
        </div>

        <Callout icon={ShieldAlert} tone="danger" title="Önce acili dışla">
          Ani yüz güçsüzlüğü inme belirtisi olabilir. Kol-bacak güçsüzlüğü, konuşma bozukluğu, çift
          görme, dengesizlik veya yeni şiddetli baş ağrısı varsa acil değerlendirme gerekir.
        </Callout>

        <Callout icon={AlertTriangle} tone="caution" title="Alın kuralı, ipucudur">
          {BELL_PALSY_SAFETY.patternWarning}
        </Callout>

        <Disclosure title="Periferik ve santral patern neden ayrışır?">
          <p>
            <span className="font-semibold text-fg">Periferik (Bell, LMN). </span>
            Lezyon n. facialis gövdesinde veya çekirdeğindedir, bu yüzden alın dahil o yarının tüm
            mimik kasları felçtir. Hasta kaşını kaldıramaz ve gözünü kapatamaz.
          </p>
          <p>
            <span className="font-semibold text-fg">Santral (inme, UMN). </span>
            Çekirdeğin alın bölümü iki hemisferden birden lif alır. Tek taraflı kortikal lezyonda
            alın ve göz kapama korunur, felç alt yüzle sınırlı kalır.
          </p>
        </Disclosure>

        <Disclosure title="Bell fenomeni nedir?">
          <p>
            Göz kapatmaya çalışırken göz küresinin yukarı ve dışa dönmesi fizyolojik bir savunmadır;
            normalde kapak kapandığı için görünmez. Bell paralizisinde m. orbicularis oculi felci
            nedeniyle göz açık kaldığından (lagoftalmi) skleranın beyazı dışarıdan görünür.
          </p>
        </Disclosure>

        <Disclosure title="Bell paralizisi tanısı nasıl konur?">
          <p>
            İdiyopatik akut periferik fasiyal nöropatidir; viral reaktivasyon olası
            mekanizmalardandır. Tanı, diğer nedenler dışlandıktan sonra konur. Saatler içinde
            yerleşen tek taraflı tam hemifasiyal güçsüzlük tipiktir.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
