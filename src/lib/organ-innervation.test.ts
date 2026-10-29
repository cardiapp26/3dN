import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ORGAN_INNERVATIONS,
  calculateOrganActivation,
  getOrganInnervation,
  VAGUS_COURSE_WAYPOINTS,
} from "./organ-innervation.ts";

describe("organ innervation registry", () => {
  it("maps core thoracic and abdominal viscera to the vagus nerve (CN X)", () => {
    assert.equal(ORGAN_INNERVATIONS.heart.primaryNerveId, 10);
    assert.equal(ORGAN_INNERVATIONS.stomach.primaryNerveId, 10);
    assert.equal(ORGAN_INNERVATIONS.lungs.primaryNerveId, 10);
    assert.equal(ORGAN_INNERVATIONS.airway.primaryNerveId, 10);
  });

  it("maps somatic and branchial cranial targets correctly", () => {
    assert.equal(ORGAN_INNERVATIONS.masseter.primaryNerveId, 5);
    assert.equal(ORGAN_INNERVATIONS.frontalis.primaryNerveId, 7);
    assert.equal(ORGAN_INNERVATIONS.scm.primaryNerveId, 11);
    assert.equal(ORGAN_INNERVATIONS.tongue.primaryNerveId, 12);
  });

  it("strips directional mirror suffixes in getOrganInnervation", () => {
    const fromTwin = getOrganInnervation("heart-1");
    assert.ok(fromTwin);
    assert.equal(fromTwin?.organId, "heart");

    const fromMirrored = getOrganInnervation("masseter--1");
    assert.ok(fromMirrored);
    assert.equal(fromMirrored?.organId, "masseter");
  });

  it("calculates physiological activation timing with smooth rise and decay", () => {
    // Before arrival: low baseline
    const before = calculateOrganActivation("heart", 10, 0.2, true);
    assert.ok(before <= 0.05);

    // At peak: high activation
    const peak = calculateOrganActivation("heart", 10, 0.64, true);
    assert.ok(peak > 0.9);

    // After end: baseline
    const after = calculateOrganActivation("heart", 10, 0.95, true);
    assert.ok(after <= 0.05);

    // Unrelated nerve returns 0
    const wrongNerve = calculateOrganActivation("heart", 3, 0.64, true);
    assert.equal(wrongNerve, 0);
  });

  it("provides 4 continuous waypoints along the vagus nerve journey", () => {
    assert.equal(VAGUS_COURSE_WAYPOINTS.length, 4);
    assert.equal(VAGUS_COURSE_WAYPOINTS[0].id, "vagus-origin");
    assert.equal(VAGUS_COURSE_WAYPOINTS[3].id, "vagus-abdomen");
    // Ensure signal scrubbing progresses downwards
    for (let i = 1; i < VAGUS_COURSE_WAYPOINTS.length; i++) {
      assert.ok(
        VAGUS_COURSE_WAYPOINTS[i].signalScrub > VAGUS_COURSE_WAYPOINTS[i - 1].signalScrub,
      );
    }
  });
});
