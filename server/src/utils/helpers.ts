export function getCreditLevel(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function calculateNewCreditScore(currentScore: number, rating: number): number {
  const weight = 0.1;
  const newScore = currentScore * (1 - weight) + (rating * 20) * weight;
  return Math.round(Math.max(0, Math.min(100, newScore)));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getCurrentTime(): string {
  return new Date().toISOString();
}
