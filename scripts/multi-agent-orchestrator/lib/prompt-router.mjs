export function analyzePrompt(prompt, options = {}) {
  const text = String(prompt ?? "").trim();
  const normalized = text.toLowerCase();

  const prNumber = options.prNumber ?? extractPrNumber(normalized);
  const explicitProfile =
    options.profile && options.profile !== "auto" ? options.profile : null;

  const signal = {
    asksPrReview:
      /\breview\b.*\bpr\b|\bpr\b.*\breview\b|\bcode review\b|\breview den pr\b/.test(
        normalized,
      ) || Boolean(prNumber),
    asksFeature:
      /\bfeature\b|\bimplement\b|\bbuild\b|\bbau\b|\bneu(es|e)? feature\b|\bentwickle\b|\bfix\b|\bbugfix\b|\brefactor\b/.test(
        normalized,
      ),
    asksDocs: /\bdocs\b|\bdokumentation\b|\breadme\b/.test(normalized),
    asksDb:
      /\bmigration\b|\brls\b|\bsupabase\b|\bsql\b|\bschema\b|\bpolicy\b/.test(
        normalized,
      ),
    asksIssue: /\bissue\b|\bticket\b|\bgithub issue\b/.test(normalized),
    asksPlanning:
      /\bplan\b|\bplanung\b|\broadmap\b|\bkonzept\b|\bplanungsmodus\b|\bplan mode\b/.test(
        normalized,
      ),
    asksArchitectureLevelChange:
      /\barchitektur\b|\barchitecture\b|\bruntime\b|\bsecurity model\b|\bfolder convention\b|\badr\b/.test(
        normalized,
      ),
  };

  const primaryProfile =
    explicitProfile ??
    (signal.asksPrReview
      ? "pr-review"
      : signal.asksFeature || signal.asksPlanning
        ? "feature-delivery"
        : signal.asksDocs
          ? "docs-maintenance"
          : "feature-delivery");

  const requiredSkills = buildRequiredSkills(primaryProfile, signal);

  return {
    prompt: text,
    normalized,
    primaryProfile,
    prNumber,
    requiredSkills,
    signal,
  };
}

function buildRequiredSkills(primaryProfile, signal) {
  const required = new Set(["pnp-orchestrator"]);

  if (primaryProfile === "pr-review") {
    required.add("pnp-pr-review");
    required.add("pnp-pr-readiness");
  }

  if (primaryProfile === "feature-delivery") {
    required.add("pnp-feature-delivery");
    required.add("pnp-pr-readiness");
  }

  if (primaryProfile === "docs-maintenance") {
    required.add("pnp-docs-maintainer");
    required.add("pnp-pr-readiness");
  }

  if (signal.asksDb) {
    required.add("pnp-db-migration-guardrails");
  }

  if (signal.asksDocs) {
    required.add("pnp-docs-maintainer");
  }

  return [...required];
}

function extractPrNumber(normalizedPrompt) {
  const strictPrMatch = normalizedPrompt.match(
    /\b(?:pr|pull request)\s*#?\s*(\d+)\b/,
  );
  if (strictPrMatch) {
    return Number(strictPrMatch[1]);
  }

  const loosePrMatch = normalizedPrompt.match(/\bpr\s*(\d+)\b/);
  if (loosePrMatch) {
    return Number(loosePrMatch[1]);
  }

  return null;
}
