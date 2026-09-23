/**
 * Bell Paralizisi (Paralysis nervi facialis periferica) ve Fasiyal Sinir Kliniği
 *
 * Tıbbi referanslar ve klinik protokoller:
 * - House JW, Brackmann DE. Facial nerve grading system. Otolaryngol Head Neck Surg. 1985.
 * - Baugh RF, et al. Clinical Practice Guideline: Bell's Palsy. Otolaryngol Head Neck Surg. 2013.
 * - Guntinas-Lichius O, et al. Facial nerve paresis: Etiology, diagnosis, and treatment. Dtsch Arztebl Int. 2020.
 */

export type PalsyType =
  | "normal"
  | "bell-left"
  | "bell-right"
  | "central-left"
  | "central-right";

export type MimicTest =
  | "wrinkle-forehead"
  | "close-eyes"
  | "smile"
  | "puff-cheeks";

export type HouseBrackmannGrade = 1 | 2 | 3 | 4 | 5 | 6;

export interface HouseBrackmannInfo {
  grade: HouseBrackmannGrade;
  roman: string;
  title: string;
  latinTitle: string;
  summary: string;
  rest: string;
  forehead: string;
  eye: string;
  mouth: string;
  synkinesis: string;
  recoveryRate: string;
  management: string;
}

export interface TopodiagnosticLevel {
  id: string;
  order: number;
  nameTr: string;
  nameLa: string;
  anatomicalSite: string;
  branchesLost: string[];
  lacrimation: { intact: boolean; test: string; finding: string };
  stapedius: { intact: boolean; test: string; finding: string };
  taste: { intact: boolean; test: string; finding: string };
  motor: { intact: boolean; test: string; finding: string };
  associatedFindings: string;
  pearl: string;
}

export interface FacialState {
  leftForeheadWrinkle: number; // 0 (düz/felç) - 1 (tam kırışık)
  rightForeheadWrinkle: number;
  leftEyeClosure: number; // 1 (tam kapalı), <1 (lagoftalmi)
  rightEyeClosure: number;
  leftBellPhenomenon: boolean; // Göz küresinin yukarı-dışa rotasyonu
  rightBellPhenomenon: boolean;
  leftMouthPull: number; // Ağız köşesi çekmesi
  rightMouthPull: number;
  mouthMidlineOffset: number; // Ağzın saptığı yön (-1: sol, 0: orta, +1: sağ)
  leftCheekTone: number; // 1: hava kaçırmaz, 0: hava kaçışı (buccinator yetersizliği)
  rightCheekTone: number;
  summaryHeading: string;
  clinicalNote: string;
  anatomicalBasis: string;
}

/**
 * House-Brackmann Fasiyal Sinir Derecelendirme Skalası
 */
export const HOUSE_BRACKMANN_GRADES: Record<HouseBrackmannGrade, HouseBrackmannInfo> = {
  1: {
    grade: 1,
    roman: "I",
    title: "Normal",
    latinTitle: "Functio normalis",
    summary: "Tüm bölgelerde tam ve simetrik fasiyal fonksiyon.",
    rest: "Tam simetrik, normal tonus.",
    forehead: "Normal alın kırıştırma hareketi.",
    eye: "Minimal eforla tam göz kapanması.",
    mouth: "Simetrik gülümseme ve mimik hareketi.",
    synkinesis: "Sinkinezi, kontraktür veya spazm yok.",
    recoveryRate: "%100 (Bazal fizyolojik durum)",
    management: "Tedavi gerekmez; klinik takip.",
  },
  2: {
    grade: 2,
    roman: "II",
    title: "Hafif Disfonksiyon",
    latinTitle: "Disfunctio levis",
    summary: "Yakından incelemede fark edilen hafif zayıflık; istirahat simetrisi tamamen normal.",
    rest: "Normal tonus ve tam simetri.",
    forehead: "Orta-iyi düzeyde hareket korur.",
    eye: "Minimal eforla tam kapanır; hafif asimetri.",
    mouth: "Maksimal eforda hafif asimetri.",
    synkinesis: "Yok veya ancak mikroskobik düzeyde.",
    recoveryRate: "%90-95 spontan tam düzelme",
    management: "Standart 72 saatlik kortikosteroid protokolü, gündüz yapay gözyaşı.",
  },
  3: {
    grade: 3,
    roman: "III",
    title: "Orta Derecede Disfonksiyon",
    latinTitle: "Disfunctio moderata",
    summary: "Belirgin ancak şekil bozmayan asimetri. Eforla tam göz kapanması korunur.",
    rest: "Normal simetri ve dinlenme tonusu.",
    forehead: "Hafif-orta derecede hareket.",
    eye: "Efor sarf ederek tam kapanır.",
    mouth: "Maksimal eforla belirgin zayıflık, asimetrik çekilme.",
    synkinesis: "Farkedilebilir ancak hafif sinkinezi veya hemifasiyal spazm görülebilir.",
    recoveryRate: "%80-85 tam/tatmin edici düzelme",
    management: "Kortikosteroid + yoğun göz koruma (gündüz damla, gece pomad).",
  },
  4: {
    grade: 4,
    roman: "IV",
    title: "Orta-Ağır Disfonksiyon",
    latinTitle: "Disfunctio modice gravis",
    summary: "Belirgin ve şekil bozan zayıflık. Göz tam kapanamaz (lagoftalmi mevcuttur).",
    rest: "Normal simetri ve tonus korunur.",
    forehead: "Hiç hareket yok (tam pitoz / alın düzleşmesi).",
    eye: "Tam kapanamaz (Lagoftalmi + belirgin Bell fenomeni).",
    mouth: "Maksimal eforda belirgin asimetrik ve zayıf hareket.",
    synkinesis: "Belirgin sinkinezi, kitle hareketi ve kontraktür riski.",
    recoveryRate: "%60-70 parsiyel düzelme",
    management: "Kortikosteroid + Antiviral (Valasiklovir), agresif kornea koruması, nem odacığı.",
  },
  5: {
    grade: 5,
    roman: "V",
    title: "Ağır Disfonksiyon",
    latinTitle: "Disfunctio gravis",
    summary: "İstirahatte bile asimetri. Ancak zorlukla fark edilen kılcal hareket mevcuttur.",
    rest: "İstirahatte belirgin asimetri, yüzün tutulan tarafı sarkık.",
    forehead: "Hiç hareket yok.",
    eye: "Göz kapanamaz, geniş lagoftalmi ve skleranın belirgin görünmesi.",
    mouth: "Ancak hafif seğirme şeklinde minimal hareket.",
    synkinesis: "Genellikle geç dönemde şiddetli sinkineziyle seyreder.",
    recoveryRate: "%30-50 parsiyel düzelme (sekelli iyileşme)",
    management: "Kombine steroid + antiviral tedavi, erken ENoG/EMG, saatlik göz damlası, gece bandajı.",
  },
  6: {
    grade: 6,
    roman: "VI",
    title: "Total Paralizi",
    latinTitle: "Paralysis totalis",
    summary: "Tam fasiyal paralizi. Sıfır motor aktivite, istirahat tonusu kaybı.",
    rest: "Ağır asimetri, nazolabial oluk tamamen silinmiş, ağız köşesi düşmüş.",
    forehead: "Sıfır hareket.",
    eye: "Sıfır kapanma (Geniş lagoftalmi, kornea kuruma riski en yüksek seviyede).",
    mouth: "Sıfır hareket.",
    synkinesis: "Başlangıçta yok (denervasyon); 3-6 ay sonra aberan re-innervasyon gelişebilir.",
    recoveryRate: "%15-25 kalıcı defisit riski yüksek",
    management: "Acil göz koruma protokolü, oftalmoloji konsültasyonu, cerrahi dekompresyon tartışması.",
  },
};

/**
 * Topodiagnostik Lezyon Seviyeleri (CN VII Canalis Facialis İçi ve Çıkışı)
 */
export const TOPODIAGNOSTIC_LEVELS: TopodiagnosticLevel[] = [
  {
    id: "cpa-meatus",
    order: 1,
    nameTr: "Serebellopontin Köşe & İç Kulak Yolu",
    nameLa: "Angulus cerebellopontinus & Meatus acusticus internus",
    anatomicalSite: "Porus acusticus internus girişi (Pons çıkışı sonrası)",
    branchesLost: [
      "N. petrosus major",
      "N. stapedius",
      "Chorda tympani",
      "Tüm terminal motor dallar",
      "Nervus vestibulocochlearis (CN VIII) lifleri",
    ],
    lacrimation: {
      intact: false,
      test: "Schirmer Testi",
      finding: "Şiddetli lakrimasyon azalması (<5 mm ıslanma / kuru göz).",
    },
    stapedius: {
      intact: false,
      test: "Akustik Stapedius Refleksi (Timpanometri)",
      finding: "Refleks alınamaz (İşitilen sesler aşırı rahatsız edici: Hiperakuzi/Fonofobi).",
    },
    taste: {
      intact: false,
      test: "Elektrogustometri / Kimyasal Tat Testi",
      finding: "Dilin ön 2/3 kısmında tat algısı tamamen kayıp (Ageuzi).",
    },
    motor: {
      intact: false,
      test: "Mimik Kas Muayenesi",
      finding: "Tam hemifasiyal motor felç (Alın dahil tüm mimik kasları).",
    },
    associatedFindings:
      "N. vestibulocochlearis (CN VIII) komşuluğu nedeniyle sensörinöral işitme kaybı, kulak çınlaması (tinnitus) ve vertigo/dengesizlik eşlik eder. (Örn: Vestibüler schwannom / Akustik nörinom).",
    pearl:
      "Fasiyal felce ipsilateral işitme kaybı veya vertigo eşlik ediyorsa lezyon Fallop kanalında değil, iç kulak yolunda veya CPA'dadır; acil kranial MR endikasyonudur.",
  },
  {
    id: "ganglion-geniculi",
    order: 2,
    nameTr: "Genikülat Gangliyon Seviyesi",
    nameLa: "Ganglion geniculi (Genu canalis facialis)",
    anatomicalSite: "Fasiyal kanalın ilk dirseği (Labirentin segment sonu)",
    branchesLost: [
      "N. petrosus major",
      "N. stapedius",
      "Chorda tympani",
      "Terminal motor dallar",
    ],
    lacrimation: {
      intact: false,
      test: "Schirmer Testi",
      finding: "Belirgin gözyaşı azalması (N. petrosus major lezyonu). Kornea kuruma tehlikesi.",
    },
    stapedius: {
      intact: false,
      test: "Akustik Refleks",
      finding: "Refleks kaybı ve hiperakuzi mevcuttur.",
    },
    taste: {
      intact: false,
      test: "Tat Testi",
      finding: "Dil ön 2/3 tat kaybı ve tükürük salgısı azalması.",
    },
    motor: {
      intact: false,
      test: "Mimik Muayenesi",
      finding: "Tam periferik mimik felci.",
    },
    associatedFindings:
      "Dış kulak yolu, konka veya kulak zarında veziküller mevcutsa RAMSAY HUNT SENDROMU (Herpes Zoster Oticus) tanısı konur; şiddetli otalji eşlik eder.",
    pearl:
      "Ganglion geniculi lezyonunda kuru göz (kseroftalmi) en tipik ayırt edici bulgudur; çünkü N. petrosus major kanaldan çıkan ilk daldır.",
  },
  {
    id: "stapedius-branch",
    order: 3,
    nameTr: "N. Stapedius Çıkışı Seviyesi",
    nameLa: "Segmentum tympanicum & mastoideum (N. stapedius)",
    anatomicalSite: "Orta kulak arka duvarı / Piramidal eminens",
    branchesLost: [
      "N. stapedius",
      "Chorda tympani",
      "Terminal motor dallar",
    ],
    lacrimation: {
      intact: true,
      test: "Schirmer Testi",
      finding: "Normal lakrimasyon (N. petrosus major daha proksimalde ayrıldığı için korunmuştur).",
    },
    stapedius: {
      intact: false,
      test: "Akustik Refleks",
      finding: "İpsilateral akustik refleks yok; hastada gürültüye aşırı duyarlılık (Hiperakuzi).",
    },
    taste: {
      intact: false,
      test: "Tat Testi",
      finding: "Dil ön 2/3 tat kaybı mevcut.",
    },
    motor: {
      intact: false,
      test: "Mimik Muayenesi",
      finding: "Tam periferik fasiyal felç.",
    },
    associatedFindings:
      "Hasta yüksek seslerde kulağında yankılanma, ağrı ve titreşim hissinden şikayet eder.",
    pearl:
      "Schirmer testi normal olan ancak hiperakuzi ve tat kaybı bulunan hastada lezyon genikülat gangliyon sonrasında, stapedius dalı hizasındadır.",
  },
  {
    id: "chorda-tympani",
    order: 4,
    nameTr: "Chorda Tympani Seviyesi (Mastoid Segment)",
    nameLa: "Segmentum mastoideum (Canalis facialis distalis)",
    anatomicalSite: "Stilomastoid foramenin hemen öncesi",
    branchesLost: [
      "Chorda tympani",
      "Terminal motor dallar",
    ],
    lacrimation: {
      intact: true,
      test: "Schirmer Testi",
      finding: "Normal gözyaşı salgısı.",
    },
    stapedius: {
      intact: true,
      test: "Akustik Refleks",
      finding: "Normal stapedius refleksi (Hiperakuzi yoktur).",
    },
    taste: {
      intact: false,
      test: "Tat Testi",
      finding: "Dil ön 2/3 tat duyusu kaybı ve submandibular bez salgı azalması.",
    },
    motor: {
      intact: false,
      test: "Mimik Muayenesi",
      finding: "Tam periferik fasiyal felç.",
    },
    associatedFindings:
      "Hastalar sıklıkla yemek yerken dilinin o yarısında metalik tat veya tat alamama belirtir.",
    pearl:
      "Stapedius refleksi normal olup tat kaybı olan hastada lezyon n. stapedius ayrımının distalindedir.",
  },
  {
    id: "foramen-stylomastoideum",
    order: 5,
    nameTr: "Foramen Stylomastoideum & Parotis",
    nameLa: "Foramen stylomastoideum & Plexus intraparotideus",
    anatomicalSite: "Kafatası tabanından çıkış ve parotis bezi içi dallanma",
    branchesLost: ["Rami temporales, zygomatici, buccales, marginalis mandibulae, colli"],
    lacrimation: {
      intact: true,
      test: "Schirmer Testi",
      finding: "Tamamen normal lakrimasyon.",
    },
    stapedius: {
      intact: true,
      test: "Akustik Refleks",
      finding: "Tamamen normal işitme ve refleks.",
    },
    taste: {
      intact: true,
      test: "Tat Testi",
      finding: "Tamamen normal tat duyusu.",
    },
    motor: {
      intact: false,
      test: "Mimik Muayenesi",
      finding: "İzole motor mimik felci (Tüm intrakraniyal/otolojik fonksiyonlar korunmuştur).",
    },
    associatedFindings:
      "Parotis bezi kitleleri, travma veya cerrahi hasarlarda tek bir terminal dal (ör. izole marjinal mandibuler dal) tutulabilir.",
    pearl:
      "Foramen stylomastoideum sonrasındaki lezyonlarda duyu, tat, tükürük ve gözyaşı kusursuzdur; klinik sadece saf motor felçten ibarettir.",
  },
];

/**
 * Akut Yönetim ve Göz Koruma Protokolü
 */
export const TREATMENT_PROTOCOL = {
  therapeuticWindow: "İlk 72 saat altın standarttır. Tedaviye ne kadar erken başlanırsa kalıcı sekelsiz iyileşme şansı o kadar artar.",
  corticosteroids: {
    name: "Oral Prednizolon / Metilprednizolon",
    dose: "60 mg/gün (veya 1 mg/kg/gün) tek doz sabah aç karnına",
    duration: "5 gün tam doz, ardından sonraki 5 gün boyunca günde 10 mg azaltılarak 10 günde kesilir.",
    evidence: "A Seviyesi Kanıt: İnflamatuar ödemi ve Fallop kanalı içi iskemi basısını geri döndürerek kalıcı aksonal hasarı engeller.",
  },
  antivirals: {
    name: "Valasiklovir (veya Asiklovir)",
    regimen: "Valasiklovir 3 x 1000 mg/gün, 7 gün boyunca oral",
    indications:
      "Şiddetli paralizilerde (House-Brackmann Evre IV-VI) veya Ramsay Hunt (Herpes Zoster Oticus) şüphesinde kortikosteroid tedavisine eklenir.",
    notes: "Hafif olgularda tek başına antiviralin steroidden üstünlüğü kanıtlanmamıştır; her zaman steroid ile kombine edilir.",
  },
  eyeProtection: {
    title: "Agresif Kornea Koruma Protokolü (En Kritik Hasta Güvenliği Adımı)",
    subheading: "Lagoftalmi nedeniyle kornea açıkta kalır; kuruma, epitel erozyonu ve kör edici kornea ülseri riski acildir.",
    daytime: "Gündüz saat başı koruyucusuz yapay gözyaşı damlası (karboksimetilselüloz / sodyum hiyalüronat).",
    nighttime: "Gece yatmadan önce yoğun oftalmik pomad (jel/merhem) ve şeffaf polietilen nem odacığı (moisture chamber) veya cerrahi bantla mekanik göz kapağı kapama.",
    measures: [
      "Rüzgarlı havalarda ve dışarıda koruyucu kenarlıklı güneş gözlüğü kullanımı.",
      "Gözü ovuşturmaktan kesinlikle kaçınma (hissizleşmiş/kurumuş kornea kolayca epitelize olabilir).",
      "Kırmızı göz, batma hissi ve görme bulanıklığında acil oftalmoloji değerlendirmesi.",
    ],
  },
  complications: [
    {
      name: "Aberran Rejenerasyon (Sinkinezi)",
      desc: "İyileşen motor aksonların yanlış kas hedeflerine yönelmesi (ör. göz kırparken ağız köşesinin istemsiz seğirmesi).",
    },
    {
      name: "Timsah Gözyaşları Sendromu (Bogorad Sendromu)",
      desc: "Tükürük bezine gitmesi gereken sekretomotor liflerin lakrimal beze aberran yönelmesi; yemek yerken gözden yaş gelmesi.",
    },
    {
      name: "Hemifasiyal Spazm ve Kontraktür",
      desc: "Etkilenen tarafta tonus artışı ve kalıcı kas gerginliği.",
    },
  ],
};

/**
 * Simülatör için yüz kasları hareket genliği ve klinik durum hesaplayıcı
 */
export function calculateFacialState(palsyType: PalsyType, test: MimicTest): FacialState {
  // Bazal varsayılan: Normal hareketler
  let leftForehead = 0;
  let rightForehead = 0;
  let leftEyeClosure = 1;
  let rightEyeClosure = 1;
  let leftBell = false;
  let rightBell = false;
  let leftMouth = 0;
  let rightMouth = 0;
  let midlineShift = 0;
  let leftCheek = 1;
  let rightCheek = 1;

  // Teste göre bazal efor
  if (test === "wrinkle-forehead") {
    leftForehead = 1;
    rightForehead = 1;
  } else if (test === "close-eyes") {
    leftEyeClosure = 1;
    rightEyeClosure = 1;
  } else if (test === "smile") {
    leftMouth = 1;
    rightMouth = 1;
  } else if (test === "puff-cheeks") {
    leftCheek = 1;
    rightCheek = 1;
  }

  let summaryHeading = "Normal Fasiyal İnervasyon";
  let clinicalNote = "Tüm yüz bölgelerinde iki taraflı simetrik ve tam hareket mevcuttur.";
  let anatomicalBasis = "Bilateral kortikobulbar yollar ve periferik N. facialis intakttır.";

  if (palsyType === "bell-left") {
    // Sol Bell Paralizisi (Sol LMN)
    summaryHeading = "Sol Bell Paralizisi (Periferik LMN Lezyonu)";
    leftCheek = 0.1; // sol yanak gevşek

    if (test === "wrinkle-forehead") {
      leftForehead = 0; // Sol alın düzleşmiş!
      rightForehead = 1;
      clinicalNote = "Sol alın çizgileri tamamen silinmiştir; hasta sol kaşını kaldıramaz.";
      anatomicalBasis = "Periferik lezyonda sinir gövdesi hasar gördüğü için alın dalı (r. temporalis) felçlidir.";
    } else if (test === "close-eyes") {
      leftEyeClosure = 0.25; // Lagoftalmi
      leftBell = true; // Bell fenomeni: göz yukarı kayar ve sklera görünür
      clinicalNote = "Sol göz tam kapanamaz (Lagoftalmi). Bell fenomeni pozitiftir (göz küresi yukarı-dışa döner).";
      anatomicalBasis = "M. orbicularis oculi periferik denervasyonu göz kapağı kapama sfinkterini felç etmiştir.";
    } else if (test === "smile") {
      leftMouth = 0;
      rightMouth = 1;
      midlineShift = 1; // Sağlam sağ tarafa kayar
      clinicalNote = "Ağız köşesi sağlam olan sağ tarafa doğru çekilir. Sol nazolabial oluk siliktir.";
      anatomicalBasis = "Sol m. zygomaticus ve orbicularis oris çalışmadığı için sağlam tarafın kas tonusu ağzı çeker.";
    } else if (test === "puff-cheeks") {
      leftCheek = 0;
      clinicalNote = "Yanak şişirildiğinde sol ağız köşesinden hava ve tükürük kaçağı olur.";
      anatomicalBasis = "Sol m. buccinator paralizisi intraoral basınç oluşturulmasını engeller.";
    }
  } else if (palsyType === "bell-right") {
    // Sağ Bell Paralizisi (Sağ LMN)
    summaryHeading = "Sağ Bell Paralizisi (Periferik LMN Lezyonu)";
    rightCheek = 0.1;

    if (test === "wrinkle-forehead") {
      rightForehead = 0; // Sağ alın silinmiş
      leftForehead = 1;
      clinicalNote = "Sağ alın çizgileri tamamen kaybolmuştur; sağ kaş düşüktür ve kalkmaz.";
      anatomicalBasis = "Sağ periferik N. facialis gövdesi hasarlıdır; ipsilateral tüm yüz felçtir.";
    } else if (test === "close-eyes") {
      rightEyeClosure = 0.25;
      rightBell = true;
      clinicalNote = "Sağ gözde belirgin lagoftalmi ve Bell fenomeni (göz bebeği yukarı yuvarlanır).";
      anatomicalBasis = "M. orbicularis oculi innervasyonu kaybolmuştur; kornea kuruma riski yüksektir.";
    } else if (test === "smile") {
      rightMouth = 0;
      leftMouth = 1;
      midlineShift = -1; // Sağlam sol tarafa kayar
      clinicalNote = "Gülümsemede ağız sağlam sol tarafa doğru sapar; sağ ağız köşesi hareketsizdir.";
      anatomicalBasis = "Sağ mimik kasları hareketsiz olduğundan sol mimik kasları ağzı çeker.";
    } else if (test === "puff-cheeks") {
      rightCheek = 0;
      clinicalNote = "Sağ yanak şişirilemez; sağ ağız komissüründen hava kaçar.";
      anatomicalBasis = "Sağ m. buccinator felci nedeniyle yanak tonusu yetersizdir.";
    }
  } else if (palsyType === "central-left") {
    // Sol Santral Fasiyal Paralizi (Sağ Korteks / İnme lezyonu)
    summaryHeading = "Sol Santral Fasiyal Paralizi (Üst Motor Nöron / UMN)";
    leftCheek = 0.2;

    if (test === "wrinkle-forehead") {
      leftForehead = 0.95; // ALIN KORUNUR!
      rightForehead = 1;
      clinicalNote = "ALIN KORUNMUŞTUR! Hasta her iki alnını da simetrik olarak kırıştırabilir.";
      anatomicalBasis = "Fasiyal motor çekirdeğin üst yüz (alın) kısmı her iki serebral hemisferden (bilateral) innervasyon alır!";
    } else if (test === "close-eyes") {
      leftEyeClosure = 0.9; // Göz kapanması korunur veya çok hafif zayıftır
      leftBell = false;
      clinicalNote = "Göz kapanması korunmuştur; lagoftalmi veya Bell fenomeni izlenmez.";
      anatomicalBasis = "Orbicularis oculi üst lifleri bilateral kortikal temsile sahiptir; göz kapanması sağlam kalır.";
    } else if (test === "smile") {
      leftMouth = 0.1;
      rightMouth = 1;
      midlineShift = 1; // Sağlam sağ tarafa sapar
      clinicalNote = "Sol alt yüz felçlidir; ağız köşesi sağlam sağ tarafa çekilir.";
      anatomicalBasis = "Fasiyal motor çekirdeğin alt yüz kısmı sadece karşı korteksten lif alır; bu nedenle izole alt yüz felci oluşur.";
    } else if (test === "puff-cheeks") {
      leftCheek = 0.2;
      clinicalNote = "Sol alt dudak ve yanakta hava kaçağı olabilir ancak alın tamamen normaldir.";
      anatomicalBasis = "İnme (SVO) şüphesi: Hastanın kol/bacak kuvveti ve konuşması (afazi) acilen taranmalıdır!";
    }
  } else if (palsyType === "central-right") {
    // Sağ Santral Fasiyal Paralizi (Sol Korteks / İnme lezyonu)
    summaryHeading = "Sağ Santral Fasiyal Paralizi (Üst Motor Nöron / UMN)";
    rightCheek = 0.2;

    if (test === "wrinkle-forehead") {
      rightForehead = 0.95; // ALIN KORUNUR!
      leftForehead = 1;
      clinicalNote = "ALIN KORUNMUŞTUR! Hasta kaşlarını kaldırıp alnını simetrik kırıştırabilir.";
      anatomicalBasis = "Alın motor nöronları bilateral kortikobulbar girdi aldığı için sağlam sol korteks sağ alnı korur.";
    } else if (test === "close-eyes") {
      rightEyeClosure = 0.9;
      rightBell = false;
      clinicalNote = "Göz kapanması normaldir; Bell fenomeni oluşmaz.";
      anatomicalBasis = "Üst yüz sfinkteri bilateral kortikal innervasyon nedeniyle felç olmaz.";
    } else if (test === "smile") {
      rightMouth = 0.1;
      leftMouth = 1;
      midlineShift = -1; // Sağlam sol tarafa sapar
      clinicalNote = "Sağ nazolabial oluk siliktir; ağız sağlam sol tarafa çekilir.";
      anatomicalBasis = "Kontralateral motor korteks hasarı alt yüz mimik kaslarında izole zaafiyet yaratır.";
    } else if (test === "puff-cheeks") {
      rightCheek = 0.2;
      clinicalNote = "Sağ yanak tonusu azalmıştır, alın ve göz kasları sağlamdır.";
      anatomicalBasis = "İnme (SVO) alarm bulgusu: Acil nöroloji konsültasyonu ve difüzyon MR gerekir.";
    }
  }

  return {
    leftForeheadWrinkle: leftForehead,
    rightForeheadWrinkle: rightForehead,
    leftEyeClosure,
    rightEyeClosure,
    leftBellPhenomenon: leftBell,
    rightBellPhenomenon: rightBell,
    leftMouthPull: leftMouth,
    rightMouthPull: rightMouth,
    mouthMidlineOffset: midlineShift,
    leftCheekTone: leftCheek,
    rightCheekTone: rightCheek,
    summaryHeading,
    clinicalNote,
    anatomicalBasis,
  };
}
