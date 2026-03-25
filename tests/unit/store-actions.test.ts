import { buildSeedStore } from "@/data/seed";
import { parseStoreAction, validateEvidenceInput, validateStoreAction } from "@/lib/store-actions";

describe("store action validation", () => {
  test("parseStoreAction rejects unknown or malformed actions", () => {
    expect(parseStoreAction({ type: "dropDatabase" })).toBeNull();
    expect(parseStoreAction({ type: "saveIntegration", input: { integrationId: "x" } })).toBeNull();
  });

  test("validateStoreAction rejects writes against unknown records", () => {
    const store = buildSeedStore();
    const action = parseStoreAction({
      type: "reviewPolicy",
      policyId: "policy_missing",
      reviewDate: "2026-03-25"
    });

    expect(action).not.toBeNull();
    expect(validateStoreAction(store, action!)).toBe("Unknown policy.");
  });

  test("validateEvidenceInput rejects unmapped controls and policies", () => {
    const store = buildSeedStore();

    expect(
      validateEvidenceInput(store, {
        title: "Bad evidence",
        description: "",
        owner: "Security",
        controlId: "control_missing"
      })
    ).toBe("Unknown control.");

    expect(
      validateEvidenceInput(store, {
        title: "Bad evidence",
        description: "",
        owner: "Security",
        controlId: "control_access",
        policyId: "policy_missing"
      })
    ).toBe("Unknown policy.");
  });
});
