import type { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { passwordMaxLength } from "./password-policy";

export const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"] as const;
let engine: Promise<ZxcvbnFactory> | undefined;
function loadEngine() {
  engine ??= Promise.all([import("@zxcvbn-ts/core"), import("@zxcvbn-ts/language-common"), import("@zxcvbn-ts/language-en")]).then(([core, common, en]) =>
    new core.ZxcvbnFactory({ graphs: common.adjacencyGraphs, dictionary: { ...common.dictionary, ...en.dictionary }, translations: en.translations }),
  ).catch(error => { engine = undefined; throw error; });
  return engine;
}

/** Local estimation only: never send the password to a service or persist it. */
export async function estimatePasswordStrength(password: string, userInputs: string[] = []) {
  const estimator = await loadEngine();
  const result = estimator.check(password.slice(0, passwordMaxLength), ["Sanbay", "Fusion", "sanbayfusion", ...userInputs]);
  return { score: result.score, label: strengthLabels[result.score], warning: result.feedback.warning, suggestions: result.feedback.suggestions };
}
