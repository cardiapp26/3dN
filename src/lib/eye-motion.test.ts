import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SOFT_MODELS } from "./anatomy/soft-models.ts";
import {
  approach,
  currentEyePose,
  eomModelForNerve,
  eyeActionText,
  eyePose,
  eyeSigns,
  ocularRecruitment,
  resetEyeMotion,
  stepEyeMotion,
} from "./eye-motion.ts";

describe("ocular recruitment", () => {
  it("stays quiet until the spark enters the orbit, then holds", () => {
    assert.equal(ocularRecruitment(0), 0);
    assert.equal(ocularRecruitment(0.68), 0);
    assert.equal(ocularRecruitment(0.5), 0);
    assert.ok(Math.abs(ocularRecruitment(0.79) - 0.5) < 1e-9);
    assert.equal(ocularRecruitment(0.9), 1);
    assert.equal(ocularRecruitment(1), 1);
    assert.equal(ocularRecruitment(Number.NaN), 0);
  });
});

describe("eye pose", () => {
  it("abducts on VI and does nothing else", () => {
    const rest = eyePose(6, 0.2);
    assert.equal(rest.twitch, 0);
    assert.equal(rest.yaw, 0);
    const full = eyePose(6, 1);
    assert.ok(full.yaw > 0.4, "positive yaw abducts the +x eye");
    assert.equal(full.pitch, 0);
    assert.equal(full.roll, 0);
    assert.equal(full.lid, 0);
    assert.equal(full.pupil, 1);
    assert.equal(full.twitch, 1);
  });

  it("depresses, intorts and abducts on IV", () => {
    const full = eyePose(4, 1);
    assert.ok(full.pitch > 0.25, "positive pitch depresses");
    assert.ok(full.roll > 0.2, "positive roll intorts the +x eye");
    assert.ok(full.yaw > 0.15, "IV also abducts");
    assert.equal(full.lid, 0);
    assert.equal(full.pupil, 1);
  });

  it("adducts, elevates, extorts, raises the lid and constricts the pupil on III", () => {
    const full = eyePose(3, 1);
    assert.ok(full.yaw < -0.4, "negative yaw adducts the +x eye");
    assert.ok(full.pitch < -0.1, "negative pitch elevates");
    assert.ok(full.roll < -0.1, "negative roll extorts the +x eye");
    assert.equal(full.lid, 1);
    assert.ok(full.pupil < 0.75 && full.pupil > 0.4);
  });

  it("leaves sensory nerves and non-ocular muscles at rest", () => {
    for (const id of [null, 1, 2, 5, 7, 8, 9, 10, 11, 12]) {
      const pose = eyePose(id, 1);
      assert.equal(pose.twitch, 0, `nerve ${id}`);
      assert.equal(pose.yaw, 0, `nerve ${id}`);
      assert.equal(pose.pitch, 0, `nerve ${id}`);
      assert.equal(pose.roll, 0, `nerve ${id}`);
      assert.equal(pose.lid, 0, `nerve ${id}`);
      assert.equal(pose.pupil, 1, `nerve ${id}`);
    }
  });

  it("scales the action with recruitment", () => {
    const mid = eyePose(6, 0.79);
    const full = eyePose(6, 1);
    assert.ok(mid.twitch > 0.4 && mid.twitch < 0.6);
    assert.ok(mid.yaw > 0 && mid.yaw < full.yaw);
  });
});

describe("displayed twitch", () => {
  it("rises faster than it falls", () => {
    const attack = approach(0, 1, 0.07);
    const release = 1 - approach(1, 0, 0.07);
    assert.ok(attack > release);
    assert.equal(approach(0.4, 0.4, 1), 0.4);
    assert.equal(approach(0.2, 1, 0), 0.2);
  });

  it("drops the previous direction when the nerve changes", () => {
    resetEyeMotion();
    for (let i = 0; i < 30; i += 1) stepEyeMotion(6, 1, 0.05);
    assert.ok(currentEyePose().yaw > 0.3);
    const switched = stepEyeMotion(3, 1, 0.016);
    assert.ok(switched.yaw < 0, "III adduction, not leftover abduction");
    assert.ok(switched.yaw > -0.15, "one frame does not snap to the full pose");
    const cleared = stepEyeMotion(null, 1, 0.016);
    assert.equal(cleared.yaw, 0);
    assert.equal(cleared.twitch, 0);
    resetEyeMotion();
  });
});

describe("wiring", () => {
  it("names the clinical action only for the ocular motor nerves", () => {
    assert.match(eyeActionText(6) ?? "", /abdüksiyon/);
    assert.match(eyeActionText(4) ?? "", /intorsiyon/);
    assert.match(eyeActionText(3) ?? "", /pupil/);
    assert.equal(eyeActionText(2), null);
    assert.equal(eyeActionText(7), null);
  });

  it("follows the nerve side filter", () => {
    assert.deepEqual(eyeSigns("both"), [1, -1]);
    assert.deepEqual(eyeSigns("right"), [1]);
    assert.deepEqual(eyeSigns("left"), [-1]);
  });

  it("shortens the extraocular mesh that nerve owns", () => {
    for (const nerveId of [3, 4, 6]) {
      const id = eomModelForNerve(nerveId);
      assert.ok(id);
      const model = SOFT_MODELS.find((m) => m.id === id);
      assert.ok(model, id);
      assert.deepEqual(model.nerveIds, [nerveId]);
      assert.equal(model.material, "muscle");
      assert.equal(model.mirror, true);
    }
    assert.equal(eomModelForNerve(2), null);
    assert.equal(eomModelForNerve(5), null);
  });
});
