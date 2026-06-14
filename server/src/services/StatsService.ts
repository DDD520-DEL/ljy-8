import { userRepository } from '../repositories/UserRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { skillRepository } from '../repositories/SkillRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { disputeRepository } from '../repositories/DisputeRepository';
import { transactionRepository } from '../repositories/TransactionRepository';
import { db } from '../utils/db';
import { LeaderboardType, LeaderboardPeriod, LeaderboardEntry, LeaderboardResult, PublicUser } from '../types';

export interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  availableItems: number;
  totalSkills: number;
  activeSkills: number;
  borrowOrderStats: Record<string, number>;
  serviceOrderStats: Record<string, number>;
  disputeStats: {
    total: number;
    resolved: number;
    pending: number;
    resolutionRate: number;
  };
  monthlyTimeCoinFlow: {
    income: number;
    expenditure: number;
    total: number;
  };
  recentMonthlyTrend: {
    month: string;
    income: number;
    expenditure: number;
  }[];
  userGrowth: {
    month: string;
    count: number;
  }[];
  categoryStats: {
    itemCategories: Record<string, number>;
    skillCategories: Record<string, number>;
  };
}

export class StatsService {
  public getDashboardStats(): DashboardStats {
    const users = userRepository.findAll();
    const items = itemRepository.findAll();
    const skills = skillRepository.findAll();
    const borrowOrders = orderRepository.findAllBorrowOrders();
    const serviceOrders = orderRepository.findAllServiceOrders();
    const disputes = disputeRepository.findAll();
    const timeCoinTransactions = db.getAll<any>('timeCoinTransactions') || [];

    const borrowOrderStats: Record<string, number> = {};
    borrowOrders.forEach((order) => {
      borrowOrderStats[order.status] = (borrowOrderStats[order.status] || 0) + 1;
    });

    const serviceOrderStats: Record<string, number> = {};
    serviceOrders.forEach((order) => {
      serviceOrderStats[order.status] = (serviceOrderStats[order.status] || 0) + 1;
    });

    const totalDisputes = disputes.length;
    const resolvedDisputes = disputes.filter((d) => d.status === 'resolved').length;
    const pendingDisputes = disputes.filter((d) => d.status !== 'resolved').length;
    const resolutionRate = totalDisputes > 0 ? Math.round((resolvedDisputes / totalDisputes) * 100) : 0;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = timeCoinTransactions.filter(
      (t) => new Date(t.createdAt) >= currentMonthStart
    );

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenditure = monthlyTransactions
      .filter((t) => t.type === 'expenditure')
      .reduce((sum, t) => sum + t.amount, 0);

    const recentMonthlyTrend = this.getMonthlyTrend(timeCoinTransactions);
    const userGrowth = this.getUserGrowth(users);

    const itemCategories: Record<string, number> = {};
    items.forEach((item) => {
      itemCategories[item.category] = (itemCategories[item.category] || 0) + 1;
    });

    const skillCategories: Record<string, number> = {};
    skills.forEach((skill) => {
      skillCategories[skill.category] = (skillCategories[skill.category] || 0) + 1;
    });

    return {
      totalUsers: users.length,
      totalItems: items.length,
      availableItems: items.filter((i) => i.status === 'available').length,
      totalSkills: skills.length,
      activeSkills: skills.filter((s) => s.status === 'active').length,
      borrowOrderStats,
      serviceOrderStats,
      disputeStats: {
        total: totalDisputes,
        resolved: resolvedDisputes,
        pending: pendingDisputes,
        resolutionRate,
      },
      monthlyTimeCoinFlow: {
        income: monthlyIncome,
        expenditure: monthlyExpenditure,
        total: monthlyIncome + monthlyExpenditure,
      },
      recentMonthlyTrend,
      userGrowth,
      categoryStats: {
        itemCategories,
        skillCategories,
      },
    };
  }

  private getMonthlyTrend(transactions: any[]): { month: string; income: number; expenditure: number }[] {
    const months: { month: string; income: number; expenditure: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenditure = monthTransactions
        .filter((t) => t.type === 'expenditure')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({ month: monthStr, income, expenditure });
    }

    return months;
  }

  private getUserGrowth(users: any[]): { month: string; count: number }[] {
    const months: { month: string; count: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthUsers = users.filter((u) => {
        const uDate = new Date(u.createdAt);
        return uDate >= monthStart && uDate <= monthEnd;
      });

      months.push({ month: monthStr, count: monthUsers.length });
    }

    return months;
  }

  public getLeaderboard(type: LeaderboardType, period: LeaderboardPeriod): LeaderboardResult {
    let entries: LeaderboardEntry[] = [];

    switch (type) {
      case 'timeCoin':
        entries = this.getTimeCoinLeaderboard(period);
        break;
      case 'credit':
        entries = this.getCreditLeaderboard(period);
        break;
      case 'sharing':
        entries = this.getSharingLeaderboard(period);
        break;
    }

    return {
      type,
      period,
      entries,
    };
  }

  private getTimeCoinLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
    const users = userRepository.findAll();

    if (period === 'all') {
      const sorted = [...users].sort((a, b) => b.timeCoins - a.timeCoins);
      return sorted.slice(0, 50).map((user, index) => ({
        rank: index + 1,
        user: userRepository.toPublicUser(user),
        value: user.timeCoins,
      }));
    } else {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const timeCoinTransactions = db.getAll<any>('timeCoinTransactions') || [];

      const userCoinChanges: Record<string, number> = {};

      timeCoinTransactions
        .filter((t) => new Date(t.createdAt) >= monthStart)
        .forEach((t) => {
          if (!userCoinChanges[t.userId]) {
            userCoinChanges[t.userId] = 0;
          }
          if (t.type === 'income') {
            userCoinChanges[t.userId] += t.amount;
          }
        });

      const entries = Object.entries(userCoinChanges)
        .map(([userId, value]) => {
          const user = userRepository.findById(userId);
          return user ? { user, value } : null;
        })
        .filter((item): item is { user: any; value: number } => item !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 50)
        .map((item, index) => ({
          rank: index + 1,
          user: userRepository.toPublicUser(item.user),
          value: item.value,
        }));

      return entries;
    }
  }

  private getCreditLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
    const users = userRepository.findAll();

    if (period === 'all') {
      const sorted = [...users].sort((a, b) => b.creditScore - a.creditScore);
      return sorted.slice(0, 50).map((user, index) => ({
        rank: index + 1,
        user: userRepository.toPublicUser(user),
        value: user.creditScore,
      }));
    } else {
      const sorted = [...users].sort((a, b) => b.creditScore - a.creditScore);
      return sorted.slice(0, 50).map((user, index) => ({
        rank: index + 1,
        user: userRepository.toPublicUser(user),
        value: user.creditScore,
      }));
    }
  }

  private getSharingLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
    const borrowOrders = orderRepository.findAllBorrowOrders();
    const validStatuses = ['borrowing', 'returned', 'disputed'];

    let filteredOrders = borrowOrders.filter((order) => validStatuses.includes(order.status));

    if (period === 'month') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.createdAt) >= monthStart
      );
    }

    const lendCountMap: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      lendCountMap[order.lenderId] = (lendCountMap[order.lenderId] || 0) + 1;
    });

    const entries = Object.entries(lendCountMap)
      .map(([userId, value]) => {
        const user = userRepository.findById(userId);
        return user ? { user, value } : null;
      })
      .filter((item): item is { user: any; value: number } => item !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50)
      .map((item, index) => ({
        rank: index + 1,
        user: userRepository.toPublicUser(item.user),
        value: item.value,
      }));

    return entries;
  }
}

export const statsService = new StatsService();
