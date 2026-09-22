export type FiberType = "sensory" | "motor" | "mixed";
export type StudioMode = "explore" | "innervation" | "signal" | "atlas" | "imaging" | "quiz";
export type LayerId = "skull" | "brain" | "brainstem" | "nerves" | "muscles" | "organs" | "nuclei";

export type InnervationTarget = {
  id: string;
  nameTr: string;
  nameLa: string;
  kind: "muscle" | "organ" | "gland" | "sense" | "skin";
  fiber: "somatic-motor" | "visceral-motor" | "somatic-sensory" | "visceral-sensory" | "special-sense";
};

export type CranialNerve = {
  id: number;
  roman: string;
  slug: string;
  nameTr: string;
  nameLa: string;
  nameEn: string;
  type: FiberType;
  color: string;
  functionShort: string;
  functions: string[];
  nuclei: { name: string; location: string }[];
  origin: string;
  foramen: string;
  course: string;
  branches: string[];
  targets: InnervationTarget[];
  clinical: { test: string; lesion: string; pearl: string };
  mnemonicHint: string;
  atlas: string;
};

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: "skull", label: "Kafatası" },
  { id: "brain", label: "Beyin" },
  { id: "brainstem", label: "Beyin sapı" },
  { id: "nerves", label: "Sinirler" },
  { id: "muscles", label: "Kaslar" },
  { id: "organs", label: "Organlar" },
  { id: "nuclei", label: "Çekirdekler" },
];

export const CRANIAL_NERVES: CranialNerve[] = [
  {
    id: 1,
    roman: "I",
    slug: "olfactory",
    nameTr: "Koku siniri",
    nameLa: "N. olfactorius",
    nameEn: "Olfactory",
    type: "sensory",
    color: "#c4a484",
    functionShort: "Koku",
    functions: [
      "Burun mukozasındaki koku reseptörlerinden koku duyusunu taşır.",
      "Gerçek bir periferik sinir değil, santral sinir sistemi traktusudur.",
    ],
    nuclei: [{ name: "Bulbus olfactorius", location: "Frontal lobun alt yüzü" }],
    origin: "Regio olfactoria (üst konka ve septumun üst 1/3'ü)",
    foramen: "Lamina cribrosa (os ethmoidale)",
    course:
      "Fila olfactoria kribriform plaktan geçer, koku soğanında sinaps yapar; tractus olfactorius primer koku korteksine gider.",
    branches: ["Fila olfactoria", "Tractus olfactorius", "Stria olfactoria medialis / lateralis"],
    targets: [
      { id: "olf-epith", nameTr: "Koku epiteli", nameLa: "Regio olfactoria", kind: "sense", fiber: "special-sense" },
    ],
    clinical: {
      test: "Her burun deliğini ayrı ayrı, tanıdık kokularla (kahve, sabun) tarayın. Amonyak trigeminaldir.",
      lesion: "Anosmi, hiposmi; kafa tabanı kırığında BOS rinore ile birlikte olabilir.",
      pearl: "Foster Kennedy: ipsilateral anosmi + optik atrofi, karşı papil ödem (olfaktör oluk meningiomu).",
    },
    mnemonicHint: "On: koku, beynin en ön çifti",
    atlas: "/atlas/overview.jpg",
  },
  {
    id: 2,
    roman: "II",
    slug: "optic",
    nameTr: "Görme siniri",
    nameLa: "N. opticus",
    nameEn: "Optic",
    type: "sensory",
    color: "#6b8cae",
    functionShort: "Görme",
    functions: [
      "Retina ganglion hücre aksanlarını taşır.",
      "Görme keskinliği, görme alanı ve afferent pupilla refleksi.",
    ],
    nuclei: [
      { name: "Corpus geniculatum laterale", location: "Talamus" },
      { name: "Pretektal çekirdekler", location: "Orta beyin, pupilla refleksi" },
    ],
    origin: "Retina ganglion hücre tabakası",
    foramen: "Canalis opticus (os sphenoidale)",
    course:
      "Göz küresinden kiazmaya, kiazmada nazal lifler çaprazlaşır; traktus LGN'ye, oradan radiatio optica primer görme korteksine (kalkarin sulkus) gider.",
    branches: ["N. opticus", "Chiasma opticum", "Tractus opticus", "Radiatio optica"],
    targets: [
      { id: "retina", nameTr: "Retina", nameLa: "Retina", kind: "sense", fiber: "special-sense" },
    ],
    clinical: {
      test: "Snellen keskinliği, konfrontasyon / perimetri, RAPD (swinging flashlight), fundus.",
      lesion: "Sinir: ipsilateral körlük. Kiazma: bitemporal hemianopsi. Traktus: homonim hemianopsi.",
      pearl: "Pitüiter adenom klasikle bitemporal hemianopsi yapar.",
    },
    mnemonicHint: "Old: görme",
    atlas: "/atlas/extraocular.jpg",
  },
  {
    id: 3,
    roman: "III",
    slug: "oculomotor",
    nameTr: "Okülomotor sinir",
    nameLa: "N. oculomotorius",
    nameEn: "Oculomotor",
    type: "motor",
    color: "#7a9e7e",
    functionShort: "Göz hareketi, pupil",
    functions: [
      "SR, IR, MR, IO ve levator palpebrae superioris.",
      "Parasempatik: sfinkter pupillae ve silyer kas (akomodasyon).",
    ],
    nuclei: [
      { name: "Nucleus nervi oculomotorii", location: "Mezensefalon, colliculus superior hizası" },
      { name: "Edinger-Westphal", location: "Aynı düzey, parasempatik" },
    ],
    origin: "Fossa interpeduncularis (orta beyin ventrali)",
    foramen: "Fissura orbitalis superior",
    course:
      "Posterior serebral ve superior serebellar arterler arasından, kavernöz sinüs lateral duvarından orbitaya. Üst ve alt dallara ayrılır.",
    branches: ["Ramus superior", "Ramus inferior", "Radix parasympathica (ganglion ciliare)"],
    targets: [
      { id: "sr", nameTr: "M. rectus superior", nameLa: "M. rectus superior", kind: "muscle", fiber: "somatic-motor" },
      { id: "ir", nameTr: "M. rectus inferior", nameLa: "M. rectus inferior", kind: "muscle", fiber: "somatic-motor" },
      { id: "mr", nameTr: "M. rectus medialis", nameLa: "M. rectus medialis", kind: "muscle", fiber: "somatic-motor" },
      { id: "io", nameTr: "M. obliquus inferior", nameLa: "M. obliquus inferior", kind: "muscle", fiber: "somatic-motor" },
      { id: "lps", nameTr: "M. levator palpebrae", nameLa: "M. levator palpebrae superioris", kind: "muscle", fiber: "somatic-motor" },
      { id: "sph", nameTr: "M. sphincter pupillae", nameLa: "M. sphincter pupillae", kind: "muscle", fiber: "visceral-motor" },
      { id: "cil", nameTr: "M. ciliaris", nameLa: "M. ciliaris", kind: "muscle", fiber: "visceral-motor" },
    ],
    clinical: {
      test: "H-testi, ptozis, pupil boyutu ve ışık reaksiyonu, akomodasyon.",
      lesion: "Aşağı-dışa bakış, ptozis, midriyazis. Kompresyonda önce pupil (yüzeyel parasempatik lifler).",
      pearl: "PCOM anevrizması ağrılı pupil-tutulumlu III. sinir felci yapabilir. 'Down and out'.",
    },
    mnemonicHint: "Olympus: LR6 SO4, geri kalanı 3",
    atlas: "/atlas/extraocular.jpg",
  },
  {
    id: 4,
    roman: "IV",
    slug: "trochlear",
    nameTr: "Troklear sinir",
    nameLa: "N. trochlearis",
    nameEn: "Trochlear",
    type: "motor",
    color: "#8b9e6b",
    functionShort: "Superior oblik",
    functions: [
      "Tek kas: m. obliquus superior (depresyon, intorsiyon, abdüksiyon).",
      "Tek dorsal çıkan ve tamamen çaprazlaşan kafa çiftidir.",
    ],
    nuclei: [{ name: "Nucleus nervi trochlearis", location: "Mezensefalon, colliculus inferior hizası" }],
    origin: "Orta beyin dorsali (velum medullare superius önü)",
    foramen: "Fissura orbitalis superior",
    course:
      "Beyin sapını dorsaldan dolar, ambient sisternadan kavernöz sinüse, sonra orbitaya. En ince ve en uzun intrakranial seyir.",
    branches: ["Tek motor gövde"],
    targets: [
      { id: "so", nameTr: "M. obliquus superior", nameLa: "M. obliquus superior", kind: "muscle", fiber: "somatic-motor" },
    ],
    clinical: {
      test: "Baş eğme (Bielschowsky), aşağı-içe bakışta diplopi.",
      lesion: "Etkilenen tarafa başı eğememe; merdiven inerken diplopi. Kompansatuar baş eğme karşı tarafa.",
      pearl: "Kafa travmasında en sık yaralanan kafa çiftidir; uzun ve ince seyir.",
    },
    mnemonicHint: "Towering: SO4",
    atlas: "/atlas/extraocular.jpg",
  },
  {
    id: 5,
    roman: "V",
    slug: "trigeminal",
    nameTr: "Üçüz sinir",
    nameLa: "N. trigeminus",
    nameEn: "Trigeminal",
    type: "mixed",
    color: "#b07870",
    functionShort: "Yüz duyusu, çiğneme",
    functions: [
      "Yüz, kornea, burun-ağız mukozası, duranın büyük kısmının somatik duyusu.",
      "Çiğneme kasları, mylohyoid, digastricus ön karın, tensor tympani, tensor veli palatini.",
    ],
    nuclei: [
      { name: "Nucleus mesencephalicus", location: "Mezensefalon, propriosepsiyon" },
      { name: "Nucleus principalis", location: "Pons, dokunma" },
      { name: "Nucleus spinalis", location: "Pons-servikal, ağrı/ısı" },
      { name: "Nucleus motorius n. V", location: "Üst pons" },
    ],
    origin: "Ponsun anterolateral yüzü (orta serebellar pedinkül önü)",
    foramen: "V1: FOS · V2: foramen rotundum · V3: foramen ovale",
    course:
      "Ganglion trigeminale (Gasser) impressio trigeminalis'te. V1 kavernöz sinüs lateralinden FOS; V2 rotundum → fossa pterygopalatina; V3 ovale → fossa infratemporalis.",
    branches: [
      "N. ophthalmicus (V1): n. frontalis, lacrimalis, nasociliaris",
      "N. maxillaris (V2): n. infraorbitalis, zygomaticus, palatini",
      "N. mandibularis (V3): n. lingualis, alveolaris inferior, auriculotemporalis, motor dallar",
    ],
    targets: [
      { id: "masseter", nameTr: "M. masseter", nameLa: "M. masseter", kind: "muscle", fiber: "somatic-motor" },
      { id: "temporalis", nameTr: "M. temporalis", nameLa: "M. temporalis", kind: "muscle", fiber: "somatic-motor" },
      { id: "pter-m", nameTr: "M. pterygoideus medialis", nameLa: "M. pterygoideus medialis", kind: "muscle", fiber: "somatic-motor" },
      { id: "pter-l", nameTr: "M. pterygoideus lateralis", nameLa: "M. pterygoideus lateralis", kind: "muscle", fiber: "somatic-motor" },
      { id: "face-v1", nameTr: "Alın ve kornea (V1)", nameLa: "N. ophthalmicus", kind: "skin", fiber: "somatic-sensory" },
      { id: "face-v2", nameTr: "Yanah (V2)", nameLa: "N. maxillaris", kind: "skin", fiber: "somatic-sensory" },
      { id: "face-v3", nameTr: "Mandibula ve dil 2/3 (V3)", nameLa: "N. mandibularis", kind: "skin", fiber: "somatic-sensory" },
    ],
    clinical: {
      test: "Yüzde üç dermatomda dokunma/iğne, kornea refleksi, masseter/temporalis palpasyonu, çene açma.",
      lesion: "Trigeminal nevralji (çoğunlukla V2/V3). Kornea refleksi kaybı. Çene felç tarafına sapar.",
      pearl: "Kornea refleksi: afferent V1, efferent VII.",
    },
    mnemonicHint: "Top: diş hekiminin siniri",
    atlas: "/atlas/trigeminal.jpg",
  },
  {
    id: 6,
    roman: "VI",
    slug: "abducens",
    nameTr: "Abdusens siniri",
    nameLa: "N. abducens",
    nameEn: "Abducens",
    type: "motor",
    color: "#6a9aa0",
    functionShort: "Lateral rektus",
    functions: ["Tek kas: m. rectus lateralis; gözü abdüksiyona götürür."],
    nuclei: [{ name: "Nucleus nervi abducentis", location: "Pons altı, 4. ventrikül tabanı (colliculus facialis)" }],
    origin: "Pontomedüller birleşim, piramitlerin lateralinde",
    foramen: "Fissura orbitalis superior",
    course:
      "En uzun intradural seyir: klivus üzerinde Dorello kanalından kavernöz sinüsün içinden (karotisin lateralinde) orbitaya.",
    branches: ["Tek motor gövde"],
    targets: [
      { id: "lr", nameTr: "M. rectus lateralis", nameLa: "M. rectus lateralis", kind: "muscle", fiber: "somatic-motor" },
    ],
    clinical: {
      test: "Lateral bakış; horizontal diplopi uzak mesafede artar.",
      lesion: "İç şaşılık (ezotropya), horizontal diplopi. Kafa içi basınç artışında yalancı lokalize edici belirti olabilir.",
      pearl: "LR6 SO4: lateral rektus 6, superior oblik 4, geri kalan ekstraoküler kaslar 3.",
    },
    mnemonicHint: "A: LR6",
    atlas: "/atlas/extraocular.jpg",
  },
  {
    id: 7,
    roman: "VII",
    slug: "facial",
    nameTr: "Yüz siniri",
    nameLa: "N. facialis",
    nameEn: "Facial",
    type: "mixed",
    color: "#c48b7a",
    functionShort: "Mimik, tat, salya/göz yaşı",
    functions: [
      "Mimik kasları, stapedius, stylohyoid, digastricus arka karın.",
      "Dil ön 2/3 tat (chorda tympani).",
      "Parasempatik: lakrimal, submandibular, sublingual bezler.",
    ],
    nuclei: [
      { name: "Nucleus nervi facialis", location: "Alt pons tegmentumu" },
      { name: "Nucleus salivatorius superior", location: "Pons, parasempatik" },
      { name: "Nucleus solitarius (rostral)", location: "Tat" },
      { name: "Nucleus spinalis n. V", location: "Kulak çevresi somatik duyu" },
    ],
    origin: "Pontoserebellar köşe (CN VIII ile birlikte)",
    foramen: "Meatus acusticus internus → canalis facialis → foramen stylomastoideum",
    course:
      "Abdusens çekirdeğini dolanır (genu, colliculus facialis). İç kulak yolundan fasiyal kanala; ganglion geniculi; stilomastoid delikten çıkar, parotis içinde 5 terminal dal.",
    branches: [
      "N. petrosus major",
      "N. stapedius",
      "Chorda tympani",
      "Temporal, zigomatik, bukkal, marjinal mandibular, servikal",
    ],
    targets: [
      { id: "frontalis", nameTr: "M. frontalis", nameLa: "M. occipitofrontalis (venter frontalis)", kind: "muscle", fiber: "somatic-motor" },
      { id: "oo", nameTr: "M. orbicularis oculi", nameLa: "M. orbicularis oculi", kind: "muscle", fiber: "somatic-motor" },
      { id: "or", nameTr: "M. orbicularis oris", nameLa: "M. orbicularis oris", kind: "muscle", fiber: "somatic-motor" },
      { id: "zyg", nameTr: "M. zygomaticus", nameLa: "M. zygomaticus major", kind: "muscle", fiber: "somatic-motor" },
      { id: "buc", nameTr: "M. buccinator", nameLa: "M. buccinator", kind: "muscle", fiber: "somatic-motor" },
      { id: "plat", nameTr: "M. platysma", nameLa: "M. platysma", kind: "muscle", fiber: "somatic-motor" },
      { id: "lacrimal", nameTr: "Lakrimal bez", nameLa: "Glandula lacrimalis", kind: "gland", fiber: "visceral-motor" },
      { id: "subman", nameTr: "Submandibular bez", nameLa: "Glandula submandibularis", kind: "gland", fiber: "visceral-motor" },
      { id: "taste-ant", nameTr: "Dil ön 2/3 tat", nameLa: "Chorda tympani", kind: "sense", fiber: "special-sense" },
    ],
    clinical: {
      test: "Alın kırıştırma, göz kapama, diş gösterme, ıslık; tat; stapedius (hiperakuzi); Schirmer.",
      lesion: "Üst motor: alın korunur (bilateral innervasyon). Alt motor (Bell): tüm hemifasiyal felç. Ramsay Hunt: VZV + vezikül.",
      pearl: "Bell felcinde alın tutulur; inmede alın genellikle korunur.",
    },
    mnemonicHint: "Finn: To Zanzibar By Motor Car",
    atlas: "/atlas/facial.jpg",
  },
  {
    id: 8,
    roman: "VIII",
    slug: "vestibulocochlear",
    nameTr: "Vestibülokoklear sinir",
    nameLa: "N. vestibulocochlearis",
    nameEn: "Vestibulocochlear",
    type: "sensory",
    color: "#7a8ab0",
    functionShort: "İşitme ve denge",
    functions: [
      "Koklear dal: işitme.",
      "Vestibüler dal: baş pozisyonu, lineer ve açısal ivme (denge).",
    ],
    nuclei: [
      { name: "Nucleus cochlearis ventralis / dorsalis", location: "Pontomedüller birleşim" },
      { name: "Nuclei vestibulares (4)", location: "4. ventrikül tabanı, area vestibularis" },
    ],
    origin: "Pontoserebellar köşe",
    foramen: "Meatus acusticus internus",
    course:
      "İç kulak yolunda VII ile birlikte. Koklear lifler spiral gangliyondan; vestibüler lifler Scarpa gangliyonundan.",
    branches: ["N. cochlearis", "N. vestibularis"],
    targets: [
      { id: "cochlea", nameTr: "Koklea (Corti organı)", nameLa: "Cochlea", kind: "sense", fiber: "special-sense" },
      { id: "vest", nameTr: "Yarım daire kanalları, utrikulus, sakkulus", nameLa: "Labyrinthus vestibularis", kind: "sense", fiber: "special-sense" },
    ],
    clinical: {
      test: "Fısıltı, Weber-Rinne, nistagmus, head-impulse, Dix-Hallpike.",
      lesion: "Sensorinöral işitme kaybı, tinnitus, vertigo. CPA'da akustik nörinom (vestibüler şvannom) VII ile birlikte.",
      pearl: "Weber: sensorinöralde sağlam tarafa, iletimde hasta tarafa lateralize olur.",
    },
    mnemonicHint: "And: işitme / denge",
    atlas: "/atlas/brainstem.jpg",
  },
  {
    id: 9,
    roman: "IX",
    slug: "glossopharyngeal",
    nameTr: "Glossofaringeal sinir",
    nameLa: "N. glossopharyngeus",
    nameEn: "Glossopharyngeal",
    type: "mixed",
    color: "#9a7a8a",
    functionShort: "Yutak, tat, parotis, karotis",
    functions: [
      "Stylopharyngeus motor.",
      "Dil arka 1/3 tat ve genel duyu; orta kulak, tonsilla, farinks.",
      "Parotis parasempatik (ganglion oticum).",
      "Karotis sinüs / cisim baro- ve kemoreseptör afferentleri.",
    ],
    nuclei: [
      { name: "Nucleus ambiguus", location: "Medulla, branchiomotor" },
      { name: "Nucleus salivatorius inferior", location: "Parotis" },
      { name: "Nucleus solitarius", location: "Tat ve viseral duyu" },
      { name: "Nucleus spinalis n. V", location: "Somatik duyu" },
    ],
    origin: "Sulcus retroolivaris (medulla)",
    foramen: "Foramen jugulare (ön kompartman)",
    course: "Juguler delikten çıkar, stylopharyngeus boyunca farinkse; n. tympanicus (Jacobson) orta kulağa.",
    branches: ["N. tympanicus", "R. sinus carotici", "Rr. pharyngei", "R. stylopharyngeus", "Rr. linguales"],
    targets: [
      { id: "stylo-ph", nameTr: "M. stylopharyngeus", nameLa: "M. stylopharyngeus", kind: "muscle", fiber: "somatic-motor" },
      { id: "parotid", nameTr: "Parotis bezi", nameLa: "Glandula parotidea", kind: "gland", fiber: "visceral-motor" },
      { id: "taste-post", nameTr: "Dil arka 1/3 tat", nameLa: "Radix linguae", kind: "sense", fiber: "special-sense" },
      { id: "carotid", nameTr: "Karotis sinüs ve cisim", nameLa: "Sinus / glomus caroticum", kind: "organ", fiber: "visceral-sensory" },
    ],
    clinical: {
      test: "Gag refleksinin afferent ayağı, dil arka 1/3 tat, palatal simetri.",
      lesion: "Gag kaybı, disfaji, parotis salgısı azalması. Glossofaringeal nevralji: yutkunmayla bıçak saplanır gibi ağrı.",
      pearl: "Gag: afferent IX, efferent X.",
    },
    mnemonicHint: "German: yutak ve parotis",
    atlas: "/atlas/brainstem.jpg",
  },
  {
    id: 10,
    roman: "X",
    slug: "vagus",
    nameTr: "Gezen sinir",
    nameLa: "N. vagus",
    nameEn: "Vagus",
    type: "mixed",
    color: "#6d8f7a",
    functionShort: "Larinks, parasempatik visera",
    functions: [
      "Farinks ve larinks kasları (stylopharyngeus ve tensor veli palatini hariç).",
      "Toraks ve abdomen viserasının parasempatik innervasyonu ( fleksura splenikaya kadar).",
      "Dış kulak, epiglot tat, aortik arkus baroreseptörleri.",
    ],
    nuclei: [
      { name: "Nucleus ambiguus", location: "Medulla, larinks/farinks motor" },
      { name: "Nucleus dorsalis nervi vagi", location: "Medulla, parasempatik" },
      { name: "Nucleus solitarius", location: "Viseral duyu ve tat" },
      { name: "Nucleus spinalis n. V", location: "Aurikula duyusu" },
    ],
    origin: "Sulcus retroolivaris (IX ve XI arasında)",
    foramen: "Foramen jugulare",
    course:
      "Karotis kılıfında seyrederek toraksa iner. Sol rekürren laringeal aortik arkusu, sağ subklavyanı dolar. Özofagus pleksusu, sonra anterior/posterior vagal gövdeler olarak hiatus'tan karına.",
    branches: [
      "R. meningeus, r. auricularis (Arnold)",
      "N. laryngeus superior / recurrens",
      "Rr. cardiaci, pulmonales, oesophageales",
      "Trunci vagales anterior / posterior",
    ],
    targets: [
      { id: "larynx", nameTr: "Larinks kasları", nameLa: "Musculi laryngis", kind: "muscle", fiber: "somatic-motor" },
      { id: "pharynx", nameTr: "Farinks konstriktörleri", nameLa: "Mm. constrictores pharyngis", kind: "muscle", fiber: "somatic-motor" },
      { id: "heart", nameTr: "Kalp", nameLa: "Cor", kind: "organ", fiber: "visceral-motor" },
      { id: "lungs", nameTr: "Akciğerler", nameLa: "Pulmones", kind: "organ", fiber: "visceral-motor" },
      { id: "stomach", nameTr: "Mide", nameLa: "Gaster", kind: "organ", fiber: "visceral-motor" },
      { id: "intestine", nameTr: "İnce bağırsak / kolon (proksimal)", nameLa: "Intestinum", kind: "organ", fiber: "visceral-motor" },
    ],
    clinical: {
      test: "Palatum elevasyonu ('ahh'), uvula, ses (disfoni), gag efferenti, öksürük.",
      lesion: "Uvula sağlam tarafa sapar. Rekürren laringeal: tek taraflı vokal kord felci, ses kısıklığı. Bilateral: stridor.",
      pearl: "En uzun kafa çifti; tek kafa çifti olarak baş-boyun ötesine iner.",
    },
    mnemonicHint: "Viewed: gezer",
    atlas: "/atlas/vagus.jpg",
  },
  {
    id: 11,
    roman: "XI",
    slug: "accessory",
    nameTr: "Aksesuar sinir",
    nameLa: "N. accessorius",
    nameEn: "Accessory",
    type: "motor",
    color: "#8a7a6a",
    functionShort: "SCM ve trapezius",
    functions: [
      "Spinal kök: sternocleidomastoideus ve trapezius.",
      "Kranial kök nucleus ambiguus'tan çıkar ve vagusa katılır (laringeal).",
    ],
    nuclei: [
      { name: "Nucleus ambiguus (kranial kök)", location: "Medulla" },
      { name: "Nucleus spinalis n. accessorii", location: "C1–C5 anterior horn" },
    ],
    origin: "Spinal kök: servikal kord lateral; kranial kök: retroolivar oluk",
    foramen: "Foramen magnum (giriş) → foramen jugulare (çıkış)",
    course:
      "Spinal kökler foramen magnum'dan girer, kranial kökle birleşir, juguler delikten çıkar; SCM'yi deler, posterior üçgende trapeziusa gider.",
    branches: ["Radix cranialis", "Radix spinalis", "R. sternocleidomastoideus", "R. trapezius"],
    targets: [
      { id: "scm", nameTr: "M. sternocleidomastoideus", nameLa: "M. sternocleidomastoideus", kind: "muscle", fiber: "somatic-motor" },
      { id: "trap", nameTr: "M. trapezius", nameLa: "M. trapezius", kind: "muscle", fiber: "somatic-motor" },
    ],
    clinical: {
      test: "Başı karşı dirence çevirme (SCM), omuz silkme (trapezius).",
      lesion: "Omuz düşüklüğü, skapula alata (hafif), başı lezyon tarafına çevirmede güçsüzlük. Posterior üçgen lenf bezi diseksiyonunda risk.",
      pearl: "SCM testi karşı tarafa rotasyon yaptırır.",
    },
    mnemonicHint: "Some: omuz ve boyun",
    atlas: "/atlas/accessory.jpg",
  },
  {
    id: 12,
    roman: "XII",
    slug: "hypoglossal",
    nameTr: "Hipoglossal sinir",
    nameLa: "N. hypoglossus",
    nameEn: "Hypoglossal",
    type: "motor",
    color: "#a09070",
    functionShort: "Dil kasları",
    functions: [
      "Dilin tüm intrinsik kasları ve ekstrinsik kasların çoğu (palatoglossus hariç, o CN X).",
      "Genioglossus lezyon lateralizasyonunun anahtarıdır.",
    ],
    nuclei: [{ name: "Nucleus nervi hypoglossi", location: "Medulla, 4. ventrikül tabanı (trigonum n. XII)" }],
    origin: "Sulcus preolivaris (piramit ile zeytin arası)",
    foramen: "Canalis nervi hypoglossi",
    course:
      "Karotis kılıfını lateralden çaprazlar, hyoglossus'un üzerinde dile girer. C1 lifleri ansa cervicalis'e ayrılır (thyrohyoid, geniohyoid).",
    branches: ["Rr. linguales", "Ramus thyrohyoideus (C1)", "Radix superior ansae cervicalis (C1)"],
    targets: [
      { id: "genio", nameTr: "M. genioglossus", nameLa: "M. genioglossus", kind: "muscle", fiber: "somatic-motor" },
      { id: "hyo", nameTr: "M. hyoglossus", nameLa: "M. hyoglossus", kind: "muscle", fiber: "somatic-motor" },
      { id: "stylog", nameTr: "M. styloglossus", nameLa: "M. styloglossus", kind: "muscle", fiber: "somatic-motor" },
      { id: "intrinsic", nameTr: "İntrinsik dil kasları", nameLa: "Mm. linguae interni", kind: "muscle", fiber: "somatic-motor" },
    ],
    clinical: {
      test: "Dili dışarı çıkarma, yanlara hareket, atrofi/fasikülasyon.",
      lesion: "Dil felç tarafına sapar ('yalanı felç tarafına söyler'). ÜMN: karşı taraf, atrofisiz; AMN: ipsilateral atrofi + fasikülasyon.",
      pearl: "Palatoglossus vagus, diğer dil kasları hipoglossal.",
    },
    mnemonicHint: "Hops: dilaltı",
    atlas: "/atlas/hypoglossal.jpg",
  },
];

export const MNEMONIC = {
  names: "On Old Olympus' Towering Top, A Finn And German Viewed Some Hops",
  namesTr: "Özel Okulda Oturan Tarkan Abidin Fena Ağladı; Gece Vakti Saat Onikide",
  types: "Some Say Money Matters, But My Brother Says Big Brains Matter More",
  extraocular: "LR6 SO4; geri kalan ekstraoküler kaslar CN III",
};

export type AtlasPlate = {
  id: string;
  src: string;
  title: string;
  latinTitle: string;
  orientation: "landscape" | "portrait";
  nerveIds: readonly number[];
  description: string;
  structures: readonly string[];
};

export const ATLAS_PLATES: readonly AtlasPlate[] = [
  {
    id: "overview",
    src: "/atlas/overview.jpg",
    title: "Kafa çiftleri: alt yüz",
    latinTitle: "Basis encephali et nervi craniales",
    orientation: "landscape",
    nerveIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description:
      "Beyin tabanının inferior bakışı; bulbus olfactorius'tan nervus hypoglossus'a kadar on iki kranial sinirin çıkış ve seyir topografisi.",
    structures: [
      "Bulbus olfactorius (CN I)",
      "Chiasma opticum (CN II)",
      "Fossa interpeduncularis (CN III)",
      "N. trochlearis (CN IV)",
      "N. trigeminus (CN V)",
      "Sulcus bulbopontinus (CN VI, VII, VIII)",
      "Sulcus retroolivaris (CN IX, X, XI)",
      "Sulcus preolivaris (CN XII)",
    ],
  },
  {
    id: "brainstem",
    src: "/atlas/brainstem.jpg",
    title: "Beyin sapı kökleri ve kesiti",
    latinTitle: "Truncus encephali et arbor vitae",
    orientation: "portrait",
    nerveIds: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description:
      "Mezensefalon, pons ve medulla oblongata anatomisi; serebellumun parasagital arbor vitae kesiti ve beyin sapı kranial sinir kök çıkışları.",
    structures: [
      "Colliculus superior et inferior",
      "Pons ve pedunculus cerebellaris",
      "Medulla oblongata ve oliva",
      "Arbor vitae cerebelli",
      "Fissura mediana anterior",
    ],
  },
  {
    id: "skull-base",
    src: "/atlas/skull-base.jpg",
    title: "Kafa tabanı iç yüzü ve delikleri",
    latinTitle: "Basis cranii interna et foramina",
    orientation: "landscape",
    nerveIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description:
      "Fossa cranii anterior, media ve posterior; kafa çiftlerinin kafatasını terk ettiği kanal, yarık ve foramenlerin anatomik izdüşümü.",
    structures: [
      "Lamina cribrosa (CN I)",
      "Canalis opticus (CN II)",
      "Fissura orbitalis superior (CN III, IV, V1, VI)",
      "Foramen rotundum (CN V2)",
      "Foramen ovale (CN V3)",
      "Porus acusticus internus (CN VII, VIII)",
      "Foramen jugulare (CN IX, X, XI)",
      "Canalis hypoglossi (CN XII)",
      "Foramen magnum",
    ],
  },
  {
    id: "sagittal",
    src: "/atlas/sagittal.jpg",
    title: "Median sagital kafa ve boyun kesiti",
    latinTitle: "Sectio sagittalis mediana capitis",
    orientation: "portrait",
    nerveIds: [1, 2, 10, 12],
    description:
      "Beyin orta hat yapıları (korpus kallozum, ventriküller, hipofiz), nazofarenks, orofarenks, dil ve servikal omurga aksı.",
    structures: [
      "Corpus callosum",
      "Ventriculus tertius et quartus",
      "Glandula pituitaria (Hipofiz)",
      "Cavitas nasi ve lamina cribrosa",
      "Lingua ve kasları",
      "Larynx ve trachea",
    ],
  },
  {
    id: "extraocular",
    src: "/atlas/extraocular.jpg",
    title: "Orbita ve ekstraoküler kaslar",
    latinTitle: "Musculi bulbi et nervi orbitales",
    orientation: "landscape",
    nerveIds: [2, 3, 4, 6],
    description:
      "Göz küresi, rektus ve oblik kaslar; CN III, IV ve VI motor innervasyonu, CN II optik sinir kılıfı ve ganglion ciliare.",
    structures: [
      "M. rectus superior, inferior, medialis (CN III)",
      "M. levator palpebrae superioris (CN III)",
      "M. obliquus superior ve trochlea (CN IV)",
      "M. rectus lateralis (CN VI)",
      "N. opticus (CN II)",
      "Ggl. ciliare",
    ],
  },
  {
    id: "trigeminal",
    src: "/atlas/trigeminal.jpg",
    title: "N. trigeminus dalları ve yüz duyusu",
    latinTitle: "Nervus trigeminus et rami faciales",
    orientation: "landscape",
    nerveIds: [5],
    description:
      "Trigeminal sinirin V1 (oftalmik), V2 (maksiller) ve V3 (mandibuler) üç ana bölümü; yüzün duyusal innervasyonu ve çiğneme kasları.",
    structures: [
      "N. ophthalmicus (V1) - supratrochlearis / supraorbitalis",
      "N. maxillaris (V2) - infraorbitalis",
      "N. mandibularis (V3) - mentalis / auriculotemporalis",
      "M. masseter",
      "M. temporalis",
    ],
  },
  {
    id: "facial",
    src: "/atlas/facial.jpg",
    title: "N. facialis ve mimik kasları",
    latinTitle: "Nervus facialis et musculi faciei",
    orientation: "landscape",
    nerveIds: [7],
    description:
      "Foramen stylomastoideum'dan çıkış, glandula parotidea içindeki plexus intraparotideus (kaz ayağı - pes anserinus) ve temporal, zigomatik, bukkal, marginal mandibular, servikal dallar.",
    structures: [
      "Plexus intraparotideus (Pes anserinus)",
      "Rami temporales, zygomatici, buccales",
      "Ramus marginalis mandibulae",
      "Ramus colli",
      "Glandula parotidea",
      "M. orbicularis oculi et oris",
    ],
  },
  {
    id: "vagus",
    src: "/atlas/vagus.jpg",
    title: "N. vagus ve parasempatik viseral yol",
    latinTitle: "Nervus vagus et viscera",
    orientation: "portrait",
    nerveIds: [10],
    description:
      "Vagus sinirinin foramen jugulare'den başlayıp boyunda karotis kılıfı içinde seyrederek kalp, akciğer pleksusları ve mide/bağırsak parasempatik pleksuslarına uzanışı.",
    structures: [
      "N. vagus (vagina carotica içinde)",
      "N. laryngeus recurrens",
      "Plexus cardiacus (kalp innervasyonu)",
      "Plexus pulmonalis (bronşlar)",
      "Truncus vagalis anterior et posterior (mide/GIS)",
    ],
  },
  {
    id: "accessory",
    src: "/atlas/accessory.jpg",
    title: "N. accessorius ve boyun kasları",
    latinTitle: "Nervus accessorius et musculi colli",
    orientation: "landscape",
    nerveIds: [11],
    description:
      "N. accessorius'un kranial ve spinal kökleri; trigonum cervicale posterius'tan geçerek m. sternocleidomastoideus ve m. trapezius'a motor dallar vermesi.",
    structures: [
      "Radix spinalis n. accessorii",
      "M. sternocleidomastoideus innervasyonu",
      "Trigonum colli posterius seyri",
      "M. trapezius innervasyonu",
    ],
  },
  {
    id: "hypoglossal",
    src: "/atlas/hypoglossal.jpg",
    title: "N. hypoglossus ve dil anatomisi",
    latinTitle: "Nervus hypoglossus et lingua",
    orientation: "landscape",
    nerveIds: [12],
    description:
      "Canalis hypoglossi'den çıkan CN XII'nin trigonum caroticum ve submandibulare'den geçerek dilin intrensek ve ekstrensek kaslarına dağılımı.",
    structures: [
      "M. genioglossus",
      "M. hyoglossus",
      "M. styloglossus",
      "Musculi intrinseci linguae",
      "Ansa cervicalis ile ilişkisi",
    ],
  },
  {
    id: "medulla-spinalis",
    src: "/atlas/medulla-spinalis.jpg",
    title: "Medulla spinalis ve servikal kökler",
    latinTitle: "Medulla spinalis et radices cervicales",
    orientation: "portrait",
    nerveIds: [11],
    description:
      "Cervical medulla spinalis (omurilik) anatomisi; intumescentia cervicalis, ön/arka sinir kökleri, spinal gangliyonlar ve foramen magnum'dan kranial kaviteye yükselen N. accessorius spinal kökleri (CN XI).",
    structures: [
      "Fissura mediana anterior",
      "Sulcus medianus posterior",
      "Intumescentia cervicalis",
      "Radices anteriores et posteriores (C1-C8)",
      "Ganglia sensoria nervorum spinalium",
      "Radix spinalis nervi accessorii (CN XI)",
      "Substantia grisea (H-şekilli kelebek kesiti)",
      "Canalis centralis",
    ],
  },
] as const;

export function nerveById(id: number) {
  return CRANIAL_NERVES.find((n) => n.id === id) ?? CRANIAL_NERVES[0];
}

export const TYPE_LABEL: Record<FiberType, string> = {
  sensory: "Duyu",
  motor: "Motor",
  mixed: "Karışık",
};
