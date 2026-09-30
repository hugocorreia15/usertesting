/**
 * How user-written names are quoted back inside system messages.
 *
 * A protocol warning names the tasks it is about, and those names are the
 * author's own words, in the author's own language. Run together with commas
 * they stop reading as quotations and start reading as part of the sentence,
 * which is how "Siga o tutorial e responda às seguintes questões quando
 * terminar., Cybersickness Pós-Experiência" ends up looking like the system
 * lapsing into another language, complete with the stray "., " where one name
 * already ended in a full stop.
 *
 * Quoting them fixes the reading. It also makes the boundary between the
 * platform's words and the study's words visible, which matters for a tool
 * used in languages it does not itself speak.
 */

/** Long enough to identify a task, short enough not to swallow the message. */
const MAX_NAME = 52;

export function quoteName(name: string, max = MAX_NAME): string {
  const trimmed = (name ?? "").trim().replace(/[.,;:]+$/, "").trim();
  if (!trimmed) return '"untitled"';
  const shortened =
    trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
  return `"${shortened}"`;
}

/**
 * A readable list of quoted names, capped so a protocol with forty tasks does
 * not produce a paragraph.
 */
export function quoteNames(names: readonly string[], max = 3): string {
  const quoted = names.map((n) => quoteName(n));
  if (quoted.length === 0) return "";
  if (quoted.length <= max) {
    if (quoted.length === 1) return quoted[0];
    return `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}`;
  }
  return `${quoted.slice(0, max).join(", ")} and ${quoted.length - max} more`;
}
