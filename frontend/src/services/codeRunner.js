const JUDGE0_URL =
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

const JUDGE0_LANGUAGE_IDS = {
  typescript: 101,
  python: 109,
  cpp: 105,
  java: 91,
  sql: 82,
};

export async function runCodeOnJudge0(sourceCode, language) {
  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Execution is not supported for ${language}.`);
  }

  const response = await fetch(JUDGE0_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin: "",
      cpu_time_limit: 5,
      wall_time_limit: 10,
    }),
    signal: AbortSignal.timeout(20000),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The code execution service returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      result.message || `The code execution service returned HTTP ${response.status}.`
    );
  }

  const output = [
    result.status?.description &&
      result.status.description !== "Accepted" &&
      `Status: ${result.status.description}`,
    result.compile_output,
    result.runtime_error,
    result.stderr,
    result.stdout,
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trimEnd())
    .join("\n");

  return output || "Program completed successfully with no output.";
}
