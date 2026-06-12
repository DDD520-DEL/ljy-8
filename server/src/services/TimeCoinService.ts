import { userRepository } from '../repositories/UserRepository';

export class TimeCoinService {
  public getBalance(userId: string): number | null {
    const user = userRepository.findById(userId);
    return user ? user.timeCoins : null;
  }

  public addCoins(userId: string, amount: number): boolean {
    const user = userRepository.findById(userId);
    if (!user) return false;

    userRepository.update(userId, { timeCoins: user.timeCoins + amount });
    return true;
  }

  public deductCoins(userId: string, amount: number): boolean {
    const user = userRepository.findById(userId);
    if (!user || user.timeCoins < amount) return false;

    userRepository.update(userId, { timeCoins: user.timeCoins - amount });
    return true;
  }

  public transfer(fromUserId: string, toUserId: string, amount: number): boolean {
    const fromUser = userRepository.findById(fromUserId);
    const toUser = userRepository.findById(toUserId);
    
    if (!fromUser || !toUser || fromUser.timeCoins < amount) return false;

    userRepository.update(fromUserId, { timeCoins: fromUser.timeCoins - amount });
    userRepository.update(toUserId, { timeCoins: toUser.timeCoins + amount });
    return true;
  }
}

export const timeCoinService = new TimeCoinService();
