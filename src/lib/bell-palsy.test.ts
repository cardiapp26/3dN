import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  BELL_PALSY_SAFETY,
  calculateFacialState,
  HOUSE_BRACKMANN_GRADES,
  isEyeVisuallyClosed,
  TOPODIAGNOSTIC_LEVELS,
  TREATMENT_PROTOCOL,
  type HouseBrackmannGrade,
} from "./bell-palsy.ts";

describe("Bell Paralizisi Simülatör ve Nöromüsküler Hesaplama", () => {
  test("Normal durumda iki taraflı simetri korunur", () => {
    const forehead = calculateFacialState("normal", "wrinkle-forehead");
    assert.equal(forehead.leftForeheadWrinkle, 1);
    assert.equal(forehead.rightForeheadWrinkle, 1);
    assert.equal(forehead.mouthMidlineOffset, 0);

    const eye = calculateFacialState("normal", "close-eyes");
    assert.equal(eye.leftEyeClosure, 1);
    assert.equal(eye.rightEyeClosure, 1);
    assert.equal(eye.leftBellPhenomenon, false);
    assert.equal(eye.rightBellPhenomenon, false);
  });

  test("Periferik Bell felcinde (Sol) alın çizgisi silinir, lagoftalmi ve Bell fenomeni belirir", () => {
    const forehead = calculateFacialState("bell-left", "wrinkle-forehead");
    assert.equal(forehead.leftForeheadWrinkle, 0, "Sol alın felçli olmalı");
    assert.equal(forehead.rightForeheadWrinkle, 1, "Sağ alın normal olmalı");

    const eye = calculateFacialState("bell-left", "close-eyes");
    assert.ok(eye.leftEyeClosure < 0.5, "Sol göz tam kapanamaz (lagoftalmi)");
    assert.equal(eye.leftBellPhenomenon, true, "Sol Bell fenomeni pozitif olmalı");
    assert.equal(eye.rightBellPhenomenon, false, "Sağ göz normal kapanmalı");

    const smile = calculateFacialState("bell-left", "smile");
    assert.equal(smile.leftMouthPull, 0);
    assert.equal(smile.rightMouthPull, 1);
    assert.equal(smile.mouthMidlineOffset, 1, "Ağız sağlam sağ tarafa sapmalı");
  });

  test("Periferik Bell felcinde (Sağ) sağ taraf etkilenir ve ağız sola kayar", () => {
    const forehead = calculateFacialState("bell-right", "wrinkle-forehead");
    assert.equal(forehead.rightForeheadWrinkle, 0);
    assert.equal(forehead.leftForeheadWrinkle, 1);

    const smile = calculateFacialState("bell-right", "smile");
    assert.equal(smile.rightMouthPull, 0);
    assert.equal(smile.leftMouthPull, 1);
    assert.equal(smile.mouthMidlineOffset, -1, "Ağız sağlam sol tarafa sapmalı");
  });

  test("Santral Fasiyal Paralizide (İnme / UMN) ALIN KORUNUR (Bilateral innervasyon)", () => {
    const forehead = calculateFacialState("central-left", "wrinkle-forehead");
    assert.ok(
      forehead.leftForeheadWrinkle > 0.8,
      "Santral lezyonda bilateral kortikobulbar lifler sayesinde sol alın kırışması korunmalı",
    );
    assert.equal(forehead.rightForeheadWrinkle, 1);

    const eye = calculateFacialState("central-left", "close-eyes");
    assert.equal(eye.leftBellPhenomenon, false, "Santral lezyonda Bell fenomeni olmamalı");
    assert.ok(eye.leftEyeClosure > 0.8, "Santral lezyonda göz kapanması korunmalı");

    const smile = calculateFacialState("central-left", "smile");
    assert.ok(
      smile.leftMouthPull < 0.2,
      "Alt yüz karşı korteksten tek taraflı lif aldığı için felç olmalı",
    );
    assert.equal(smile.mouthMidlineOffset, 1, "Ağız sağlam sağ tarafa kaymalı");
  });

  test("göz yalnız göz kapatma manevrasında kapalı çizilir", () => {
    assert.equal(isEyeVisuallyClosed("wrinkle-forehead", 1), false);
    assert.equal(isEyeVisuallyClosed("smile", 1), false);
    assert.equal(isEyeVisuallyClosed("close-eyes", 1), true);
    assert.equal(isEyeVisuallyClosed("close-eyes", 0.25), false);
  });
});

describe("House-Brackmann Evreleme Sistemi Doğrulaması", () => {
  test("I'den VI'ya kadar tüm evreler eksiksiz ve sıralı mevcuttur", () => {
    const grades: HouseBrackmannGrade[] = [1, 2, 3, 4, 5, 6];
    for (const g of grades) {
      const item = HOUSE_BRACKMANN_GRADES[g];
      assert.ok(item, `Evre ${g} bulunamadı`);
      assert.equal(item.grade, g);
      assert.ok(item.title.length > 0);
      assert.ok(item.summary.length > 0);
      assert.ok(item.clinicalFocus.length > 0);
    }
  });

  test("evreler kanıtsız sabit iyileşme yüzdesi veya otomatik tedavi reçetesi içermez", () => {
    for (const item of Object.values(HOUSE_BRACKMANN_GRADES)) {
      const visibleText = Object.values(item).join(" ");
      assert.doesNotMatch(visibleText, /(?:%\s*\d|\d\s*%)|valasiklovir|dekompresyon/i);
    }
  });

  test("Evre IV ve üzerinde lagoftalmi / göz kapanamama belirtilir", () => {
    assert.match(HOUSE_BRACKMANN_GRADES[4].eye, /kapanamaz|Lagoftalmi/i);
    assert.match(HOUSE_BRACKMANN_GRADES[5].eye, /kapanamaz|lagoftalmi/i);
    assert.match(HOUSE_BRACKMANN_GRADES[6].eye, /kapanma|lagoftalmi/i);
  });
});

describe("Topodiagnostik Lezyon Haritası Doğrulaması", () => {
  test("5 anatomik seviye proksimalden distale doğru sıralıdır", () => {
    assert.equal(TOPODIAGNOSTIC_LEVELS.length, 5);
    TOPODIAGNOSTIC_LEVELS.forEach((level, idx) => {
      assert.equal(level.order, idx + 1);
    });
  });

  test("Genikülat gangliyonda lakrimasyon bozulurken foramen stylomastoideumda sağlamdır", () => {
    const geniculi = TOPODIAGNOSTIC_LEVELS.find((l) => l.id === "ganglion-geniculi");
    assert.ok(geniculi);
    assert.equal(geniculi.lacrimation.intact, false, "Genikülat gangliyonda lakrimasyon bozulmalı");

    const stylo = TOPODIAGNOSTIC_LEVELS.find((l) => l.id === "foramen-stylomastoideum");
    assert.ok(stylo);
    assert.equal(
      stylo.lacrimation.intact,
      true,
      "Foramen stylomastoideumda lakrimasyon sağlam kalmalı",
    );
    assert.equal(stylo.taste.intact, true, "Foramen stylomastoideumda tat sağlam kalmalı");
    assert.equal(
      stylo.stapedius.intact,
      true,
      "Foramen stylomastoideumda stapedius sağlam kalmalı",
    );
    assert.equal(stylo.motor.intact, false, "Foramen stylomastoideumda mimik felci olmalı");
  });
});

describe("Klinik Tedavi ve Göz Koruma Protokolü", () => {
  test("Kortikosteroid ve kornea koruma parametreleri tanımlıdır", () => {
    assert.match(TREATMENT_PROTOCOL.therapeuticWindow, /72 saat/i);
    assert.match(TREATMENT_PROTOCOL.corticosteroids.dose, /60 mg/i);
    assert.ok(TREATMENT_PROTOCOL.eyeProtection.daytime.length > 0);
    assert.ok(TREATMENT_PROTOCOL.eyeProtection.nighttime.length > 0);
    assert.ok(TREATMENT_PROTOCOL.complications.length >= 3);
  });

  test("antiviral monoterapi önerilmez ve ilaç rejimleri hekim değerlendirmesine bağlanır", () => {
    assert.match(TREATMENT_PROTOCOL.antivirals.notes, /tek başına.*önerilmez/i);
    assert.match(TREATMENT_PROTOCOL.corticosteroids.cautions, /hekim/i);
  });

  test("acil ve atipik ayırıcı tanı güvenlik ağı mevcuttur", () => {
    assert.ok(BELL_PALSY_SAFETY.emergencySigns.length >= 4);
    assert.ok(BELL_PALSY_SAFETY.atypicalFeatures.length >= 4);
    assert.match(BELL_PALSY_SAFETY.patternWarning, /dışlamaz/i);
  });
});
