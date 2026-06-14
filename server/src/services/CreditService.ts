import { userRepository } from '../repositories/UserRepository';
import { calculateNewCreditScore, getCreditLevel } from '../utils/helpers';

export class CreditService {
  public updateCreditScore(userId: string, rating: number): void {
    const user = userRepository.findById(userId);
    if (!user) return;

    const newScore = calculateNewCreditScore(user.creditScore, rating);
    userRepository.update(userId, {
      creditScore: newScore,
      creditLevel: getCreditLevel(newScore),
    });
  }

  public rewardCredit(userId: string, points: number, reason: string): void {
    const user = userRepository.findById(userId);
    if (!user) return;

    const newScore = Math.min(100, Math.max(0, user.creditScore + points));
    userRepository.update(userId, {
      creditScore: newScore,
      creditLevel: getCreditLevel(newScore),
    });
  }

  public getCreditInfo(userId: string) {
    const user = userRepository.findById(userId);
    if (!user) return null;

    return {
      creditScore: user.creditScore,
      creditLevel: user.creditLevel,
    };
  }
}

export const creditService = new CreditService();
