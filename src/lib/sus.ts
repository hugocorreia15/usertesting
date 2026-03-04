export const SUS_QUESTIONS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
] as const;

export const SUS_SCALE_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

/**
 * Calculate the SUS score (0–100) from 10 answers.
 * Odd questions (1,3,5,7,9): contribution = score - 1
 * Even questions (2,4,6,8,10): contribution = 5 - score
 * Total = sum of contributions × 2.5
 *
 * Returns null if fewer than 10 answers are provided.
 */
export function calculateSusScore(
  answers: { question_number: number; score: number }[],
): number | null {
  if (answers.length < 10) return null;

  let sum = 0;
  for (let q = 1; q <= 10; q++) {
    const answer = answers.find((a) => a.question_number === q);
    if (!answer) return null;
    if (q % 2 === 1) {
      // Odd (positive) questions
      sum += answer.score - 1;
    } else {
      // Even (negative) questions
      sum += 5 - answer.score;
    }
  }
  return sum * 2.5;
}

/**
 * Get a qualitative label for a SUS score.
 */
export function getSusLabel(score: number): string {
  if (score >= 80.3) return "Excellent";
  if (score >= 68) return "Good";
  if (score >= 51) return "OK";
  if (score >= 25) return "Poor";
  return "Awful";
}
