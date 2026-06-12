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
