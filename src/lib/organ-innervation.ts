/**
 * Organ innervation registry and dynamic physiological response engine.
 *
 * Maps cranial nerves to their target viscera and muscles, establishing
 * bi-directional interaction, signal arrival windows, and physiological responses
 * (cardiac deceleration, gastric peristalsis, skeletal twitches, glandular secretion).
 */

export type OrganInnervation = {
  organId: string;
  nameLa: string;
  nameTr: string;
  primaryNerveId: number;
  allNerveIds: number[];
  branchNameLa: string;
  branchNameTr: string;
  functionType: "parasympathetic" | "somatic_motor" | "special_sensory" | "branchial_motor";
  effectTr: string;
  /** Normalized position [0..1] along the nerve signal progress where action potential reaches the organ */
  signalArrival: {
    start: number;
    peak: number;
    end: number;
  };
  /** Camera framing target when focusing on this organ's innervation zone */
  cameraFocus: {
    position: [number, number, number];
    target: [number, number, number];
  };
};

export const ORGAN_INNERVATIONS: Record<string, OrganInnervation> = {
  heart: {
    organId: "heart",
    nameLa: "Cor",
    nameTr: "Kalp",
    primaryNerveId: 10,
    allNerveIds: [10],
    branchNameLa: "Rr. cardiaci (Plexus cardiacus)",
    branchNameTr: "Kardiyak dallar ve pleksus",
    functionType: "parasympathetic",
    effectTr: "Bradikardi: Kalp atım hızını ve AV iletimi yavaşlatır, sinoatriyal düğümü regüle eder.",
    signalArrival: { start: 0.52, peak: 0.64, end: 0.78 },
    cameraFocus: {
      position: [24, -22, 28],
      target: [1.5, -26, 3.5],
    },
  },
  stomach: {
    organId: "stomach",
    nameLa: "Gaster",
    nameTr: "Mide",
    primaryNerveId: 10,
    allNerveIds: [10],
    branchNameLa: "Truncus vagalis anterior/posterior & Rr. gastrici",
    branchNameTr: "Vagal trunkuslar ve gastrik dallar",
    functionType: "parasympathetic",
    effectTr: "Peristaltizm: Mide motilitesini ve HCl/pepsin sekresyonunu artırır, piloru gevşetir.",
    signalArrival: { start: 0.78, peak: 0.88, end: 1.0 },
    cameraFocus: {
      position: [22, -36, 32],
      target: [2.0, -42, 4.0],
    },
  },
  airway: {
    organId: "airway",
    nameLa: "Larynx & Trachea",
    nameTr: "Gırtlak ve soluk borusu",
    primaryNerveId: 10,
    allNerveIds: [10],
    branchNameLa: "N. laryngeus superior & recurrent",
    branchNameTr: "Üst ve rekürren larengeal sinir",
    functionType: "branchial_motor",
    effectTr: "Vokal kord motor innervasyonu: M. vocalis ve krikotiroid kasları uyarır, fonasyonu sağlar.",
    signalArrival: { start: 0.38, peak: 0.48, end: 0.60 },
    cameraFocus: {
      position: [16, -12, 22],
      target: [0.5, -15, 2.0],
    },
  },
  lungs: {
    organId: "lungs",
    nameLa: "Pulmones",
    nameTr: "Akciğerler",
    primaryNerveId: 10,
    allNerveIds: [10],
    branchNameLa: "Rr. pulmonales (Plexus pulmonalis)",
    branchNameTr: "Pulmoner dallar ve hilus pleksusu",
    functionType: "parasympathetic",
    effectTr: "Bronkokonstriksiyon ve bronşiyal gland sekresyonu modülasyonu.",
    signalArrival: { start: 0.60, peak: 0.72, end: 0.84 },
    cameraFocus: {
      position: [32, -24, 30],
      target: [0, -25, 2.0],
    },
  },
  pharynx: {
    organId: "pharynx",
    nameLa: "Pharynx",
    nameTr: "Yutak",
    primaryNerveId: 10,
    allNerveIds: [9, 10],
    branchNameLa: "Plexus pharyngeus (CN IX & X)",
    branchNameTr: "Farengeal pleksus dalları",
    functionType: "branchial_motor",
    effectTr: "Yutma refleksi: Konstriktör kasların sıralı peristaltik kontraksiyonu.",
    signalArrival: { start: 0.28, peak: 0.38, end: 0.50 },
    cameraFocus: {
      position: [14, -6, 18],
      target: [0, -7, 1.5],
    },
  },
  tongue: {
    organId: "tongue",
    nameLa: "Lingua",
    nameTr: "Dil kasları",
    primaryNerveId: 12,
    allNerveIds: [12, 9, 7, 5],
    branchNameLa: "Rr. linguales (CN XII motor, IX/VII/V duyu)",
    branchNameTr: "Lingual motor ve duyusal dallar",
    functionType: "somatic_motor",
    effectTr: "Dil motor kontrolü: İntrinsik ve ekstrinsik dil kaslarının koordineli hareketi.",
    signalArrival: { start: 0.55, peak: 0.75, end: 0.95 },
    cameraFocus: {
      position: [12, -7, 16],
      target: [0, -7, 5.0],
    },
  },
  masseter: {
    organId: "masseter",
    nameLa: "M. masseter",
    nameTr: "Çiğneme kası",
    primaryNerveId: 5,
    allNerveIds: [5],
    branchNameLa: "N. massetericus (CN V₃)",
    branchNameTr: "Mandibular motor dal",
    functionType: "somatic_motor",
    effectTr: "Çiğneme: Mandibulayı güçlü şekilde yukarı kaldırarak çeneyi kapatır.",
    signalArrival: { start: 0.50, peak: 0.70, end: 0.88 },
    cameraFocus: {
      position: [15, -4, 16],
      target: [4.5, -4, 3.0],
    },
  },
  temporalis: {
    organId: "temporalis",
    nameLa: "M. temporalis",
    nameTr: "Şakak kası",
    primaryNerveId: 5,
    allNerveIds: [5],
    branchNameLa: "Nn. temporales profundi (CN V₃)",
    branchNameTr: "Derin temporal motor dallar",
    functionType: "somatic_motor",
    effectTr: "Çiğneme: Çeneyi yukarı kaldırır ve geriye doğru çeker (retraksiyon).",
    signalArrival: { start: 0.45, peak: 0.65, end: 0.85 },
    cameraFocus: {
      position: [18, 2, 14],
      target: [5.0, 2, 0],
    },
  },
  frontalis: {
    organId: "frontalis",
    nameLa: "M. frontalis",
    nameTr: "Alın kası",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "Rami temporales (CN VII)",
    branchNameTr: "Temporal mimik dal",
    functionType: "somatic_motor",
    effectTr: "Mimik: Kaşları kaldırır, alında yatay kırışıklıklar oluşturur (şaşırma ifadesi).",
    signalArrival: { start: 0.45, peak: 0.65, end: 0.85 },
    cameraFocus: {
      position: [10, 6, 18],
      target: [2.0, 6, 6.0],
    },
  },
  "orbicularis-oculi": {
    organId: "orbicularis-oculi",
    nameLa: "M. orbicularis oculi",
    nameTr: "Göz çevresi kası",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "Rami zygomatici & temporales (CN VII)",
    branchNameTr: "Zigomatik ve temporal dallar",
    functionType: "somatic_motor",
    effectTr: "Göz kapatma: Göz kapaklarını kapatır ve korneayı korur (kornea refleksi efferent yolu).",
    signalArrival: { start: 0.48, peak: 0.68, end: 0.88 },
    cameraFocus: {
      position: [10, 2, 18],
      target: [3.0, 1.5, 7.0],
    },
  },
  "orbicularis-oris": {
    organId: "orbicularis-oris",
    nameLa: "M. orbicularis oris",
    nameTr: "Ağız çevresi kası",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "Rami buccales & marginalis mandibulae (CN VII)",
    branchNameTr: "Bukkal ve marginal mandibular dallar",
    functionType: "somatic_motor",
    effectTr: "Dudak sfinkteri: Dudakları kapatır, büzer ve öne doğru uzatır (ıslık çalma, öpme).",
    signalArrival: { start: 0.55, peak: 0.75, end: 0.95 },
    cameraFocus: {
      position: [10, -6, 18],
      target: [0, -6, 7.5],
    },
  },
  zygomaticus: {
    organId: "zygomaticus",
    nameLa: "M. zygomaticus major",
    nameTr: "Büyük elmacık kası",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "Rami zygomatici (CN VII)",
    branchNameTr: "Zigomatik mimik dal",
    functionType: "somatic_motor",
    effectTr: "Mimik: Ağız köşesini yukarı ve dışa çeker (gülümseme kası).",
    signalArrival: { start: 0.50, peak: 0.70, end: 0.90 },
    cameraFocus: {
      position: [12, -4, 18],
      target: [3.5, -4, 7.0],
    },
  },
  buccinator: {
    organId: "buccinator",
    nameLa: "M. buccinator",
    nameTr: "Yanak kası",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "Rami buccales (CN VII)",
    branchNameTr: "Bukkal motor dal",
    functionType: "somatic_motor",
    effectTr: "Çiğneme ve üfleme: Yanağı dişlere doğru bastırır, lokmanın vestibülde birikmesini önler.",
    signalArrival: { start: 0.52, peak: 0.72, end: 0.90 },
    cameraFocus: {
      position: [14, -5, 16],
      target: [3.5, -5.5, 6.0],
    },
  },
  scm: {
    organId: "scm",
    nameLa: "M. sternocleidomastoideus",
    nameTr: "SCM boyun kası",
    primaryNerveId: 11,
    allNerveIds: [11],
    branchNameLa: "R. sternocleidomastoideus (CN XI)",
    branchNameTr: "Aksesuar sinir SCM dalı",
    functionType: "somatic_motor",
    effectTr: "Boyun hareketi: Tek taraflı kasılmada başı karşı tarafa döndürür ve aynı tarafa eğer.",
    signalArrival: { start: 0.40, peak: 0.60, end: 0.82 },
    cameraFocus: {
      position: [16, -10, 18],
      target: [3.0, -10, 2.0],
    },
  },
  trapezius: {
    organId: "trapezius",
    nameLa: "M. trapezius",
    nameTr: "Trapez kası",
    primaryNerveId: 11,
    allNerveIds: [11],
    branchNameLa: "R. trapezius (CN XI)",
    branchNameTr: "Aksesuar sinir trapez dalı",
    functionType: "somatic_motor",
    effectTr: "Omuz elevasyonu: Skapulayı yukarı kaldırır (omuz silkme) ve kolun baş üzerine kalkışına katılır.",
    signalArrival: { start: 0.55, peak: 0.75, end: 0.98 },
    cameraFocus: {
      position: [24, -12, -18],
      target: [6.0, -10, -5.0],
    },
  },
  parotid: {
    organId: "parotid",
    nameLa: "Glandula parotidea",
    nameTr: "Parotis tükürük bezi",
    primaryNerveId: 9,
    allNerveIds: [9],
    branchNameLa: "N. tympanicus -> Ganglion oticum -> N. auriculotemporalis (CN IX)",
    branchNameTr: "Glossofaringeal parasempatik sekretomotor yol",
    functionType: "parasympathetic",
    effectTr: "Sekretomotor: Bol miktarda sulu (seröz) tükürük salgılanmasını uyarır.",
    signalArrival: { start: 0.50, peak: 0.72, end: 0.92 },
    cameraFocus: {
      position: [16, -3, 16],
      target: [5.2, -3, 3.0],
    },
  },
  submandibular: {
    organId: "submandibular",
    nameLa: "Glandula submandibularis",
    nameTr: "Çene altı tükürük bezi",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "Chorda tympani -> Ganglion submandibulare (CN VII)",
    branchNameTr: "Fasiyal parasempatik sekretomotor dal",
    functionType: "parasympathetic",
    effectTr: "Sekretomotor: Ağız tabanına seromüköz tükürük salgılanmasını uyarır.",
    signalArrival: { start: 0.55, peak: 0.75, end: 0.92 },
    cameraFocus: {
      position: [14, -8, 16],
      target: [2.5, -8.5, 5.0],
    },
  },
  lacrimal: {
    organId: "lacrimal",
    nameLa: "Glandula lacrimalis",
    nameTr: "Gözyaşı bezi",
    primaryNerveId: 7,
    allNerveIds: [7],
    branchNameLa: "N. petrosus major -> Ganglion pterygopalatinum (CN VII)",
    branchNameTr: "Büyük petrozal sekretomotor dal",
    functionType: "parasympathetic",
    effectTr: "Lakrimasyon: Gözyaşı salgılanmasını artırır, kornea ve konjonktivayı nemlendirir.",
    signalArrival: { start: 0.52, peak: 0.72, end: 0.90 },
    cameraFocus: {
      position: [12, 4, 16],
      target: [4.0, 2.5, 6.5],
    },
  },
  "olfactory-mucosa": {
    organId: "olfactory-mucosa",
    nameLa: "Regio olfactoria",
    nameTr: "Koku mukozası",
    primaryNerveId: 1,
    allNerveIds: [1],
    branchNameLa: "Fila olfactoria (CN I)",
    branchNameTr: "Koku iplikçikleri ve lamina cribrosa",
    functionType: "special_sensory",
    effectTr: "Koku duyusu: Koku molekülleri bipolar reseptör nöronları uyarır, bulbus olfactorius'a iletilir.",
    signalArrival: { start: 0.35, peak: 0.55, end: 0.85 },
    cameraFocus: {
      position: [8, 3, 16],
      target: [0.6, 2.0, 6.8],
    },
  },
  labyrinth: {
    organId: "labyrinth",
    nameLa: "Auris interna",
    nameTr: "İç kulak labirenti",
    primaryNerveId: 8,
    allNerveIds: [8],
    branchNameLa: "N. vestibulocochlearis (CN VIII)",
    branchNameTr: "Vestibüler ve koklear dallar",
    functionType: "special_sensory",
    effectTr: "İşitme ve denge: Koklea ses titreşimlerini, semisirküler kanallar açısal ivmelenmeyi algılar.",
    signalArrival: { start: 0.40, peak: 0.65, end: 0.90 },
    cameraFocus: {
      position: [12, 1, 10],
      target: [3.8, 0.6, 0],
    },
  },
};

/**
 * Calculates organ activation intensity (0..1) given a nerve's signal progress.
 * Rises rapidly upon arrival and smoothly eases out.
 */
export function calculateOrganActivation(
  organId: string,
  nerveId: number | null,
  progress: number,
  playing: boolean,
): number {
  const info = ORGAN_INNERVATIONS[organId];
  if (!info || nerveId === null) return 0;
  if (!info.allNerveIds.includes(nerveId)) return 0;

  // In idle/paused state with nerve selected, maintain a subtle resting tone (0.15)
  if (!playing) return 0.15;

  const { start, peak, end } = info.signalArrival;
  if (progress < start || progress > end) return 0.05;

  if (progress <= peak) {
    const t = (progress - start) / (peak - start);
    return 0.05 + 0.95 * (t * t * (3 - 2 * t));
  } else {
    const t = (progress - peak) / (end - peak);
    return 0.05 + 0.95 * (1 - Math.sin((t * Math.PI) / 2));
  }
}

/**
 * Returns organ innervation info if this ID corresponds to an innervated structure
 */
export function getOrganInnervation(id: string): OrganInnervation | null {
  // Strip mirror suffixes like "heart-1" or "masseter--1"
  const baseId = id.replace(/-?-1$/, "");
  return ORGAN_INNERVATIONS[baseId] ?? null;
}

/**
 * Guided "Follow the Nerve" Waypoints for Vagus (CN X) and other major long pathways.
 * Directly addresses: "Follow the vagus nerve from the brainstem into the chest and abdomen"
 */
export type NerveCourseWaypoint = {
  id: string;
  step: number;
  titleTr: string;
  subtitleLa: string;
  descriptionTr: string;
  associatedOrgans: string[];
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  signalScrub: number;
};

export const VAGUS_COURSE_WAYPOINTS: NerveCourseWaypoint[] = [
  {
    id: "vagus-origin",
    step: 1,
    titleTr: "1. Beyin Sapı Çıkışı ve Foramen Jugulare",
    subtitleLa: "Sulcus posterolateralis & Foramen jugulare",
    descriptionTr:
      "Vagus siniri medulla oblongata'dan 8-10 kökçükle çıkar, foramen jugulare'den kafatasını terk eder.",
    associatedOrgans: [],
    camera: {
      position: [18, -3, 16],
      target: [2.5, -2, -1.0],
    },
    signalScrub: 0.12,
  },
  {
    id: "vagus-cervical",
    step: 2,
    titleTr: "2. Boyun: Farenks ve Larenks İnnervasyonu",
    subtitleLa: "Spatium parapharyngeum & N. laryngeus recurrens",
    descriptionTr:
      "Karotis kılıfı içinde seyreder. Farengeal dallar yutmayı sağlar. Rekürren larengeal sinir damarların altından kancalaşarak larenkse döner.",
    associatedOrgans: ["pharynx", "airway"],
    camera: {
      position: [20, -14, 24],
      target: [1.2, -15, 2.2],
    },
    signalScrub: 0.42,
  },
  {
    id: "vagus-thorax",
    step: 3,
    titleTr: "3. Toraks: Kalp ve Akciğer Pleksusları",
    subtitleLa: "Plexus cardiacus & Plexus pulmonalis",
    descriptionTr:
      "Aort kavsinin önünden geçer. Kalp kasına parasempatik lifler göndererek ritmi yavaşlatır (bradikardi). Akciğer hiluslarında pulmoner pleksusu oluşturur.",
    associatedOrgans: ["heart", "lungs"],
    camera: {
      position: [28, -25, 30],
      target: [1.5, -27, 3.8],
    },
    signalScrub: 0.65,
  },
  {
    id: "vagus-abdomen",
    step: 4,
    titleTr: "4. Abdomen: Mide ve Enterik Sistem",
    subtitleLa: "Truncus vagalis anterior/posterior & Rr. gastrici",
    descriptionTr:
      "Özofagus üzerinden diafragmayı geçer, ön ve arka vagal kütükleri oluşturur. Mide duvarında yayılarak peristaltizm ve sindirim salgılarını uyarır.",
    associatedOrgans: ["stomach"],
    camera: {
      position: [24, -38, 34],
      target: [2.5, -43, 4.2],
    },
    signalScrub: 0.90,
  },
];
