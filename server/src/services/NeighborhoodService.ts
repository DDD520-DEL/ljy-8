import { userRepository } from '../repositories/UserRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { skillRepository } from '../repositories/SkillRepository';
import { PublicUser, ItemWithOwner, SkillWithProvider } from '../types';

export class NeighborhoodService {
  public getNeighborhoodMembers(neighborhood: string, excludeUserId?: string): PublicUser[] {
    const users = userRepository.findByNeighborhood(neighborhood, excludeUserId);
    return users.map((user) => userRepository.toPublicUser(user));
  }

  public getNeighborhoodItems(neighborhood: string, category?: string, keyword?: string): ItemWithOwner[] {
    const userIds = userRepository
      .findByNeighborhood(neighborhood)
      .map((user) => user.id);

    let items = itemRepository.findAll().filter((item) => userIds.includes(item.ownerId));

    if (category && category !== 'all') {
      items = items.filter((item) => item.category === category);
    }

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerKeyword) ||
          item.description.toLowerCase().includes(lowerKeyword)
      );
    }

    return items
      .map((item) => itemRepository.toItemWithOwner(item))
      .sort((a, b) => b.owner.creditScore - a.owner.creditScore);
  }

  public getNeighborhoodSkills(neighborhood: string, category?: string, keyword?: string): SkillWithProvider[] {
    const userIds = userRepository
      .findByNeighborhood(neighborhood)
      .map((user) => user.id);

    let skills = skillRepository.findAll().filter((skill) => userIds.includes(skill.providerId));

    if (category && category !== 'all') {
      skills = skills.filter((skill) => skill.category === category);
    }

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      skills = skills.filter(
        (skill) =>
          skill.title.toLowerCase().includes(lowerKeyword) ||
          skill.description.toLowerCase().includes(lowerKeyword)
      );
    }

    return skills
      .map((skill) => skillRepository.toSkillWithProvider(skill))
      .sort((a, b) => b.provider.creditScore - a.provider.creditScore);
  }

  public getNeighborhoodStats(neighborhood: string): {
    memberCount: number;
    itemCount: number;
    skillCount: number;
  } {
    const members = userRepository.findByNeighborhood(neighborhood);
    const userIds = members.map((user) => user.id);
    const items = itemRepository.findAll().filter((item) => userIds.includes(item.ownerId));
    const skills = skillRepository.findAll().filter((skill) => userIds.includes(skill.providerId));

    return {
      memberCount: members.length,
      itemCount: items.length,
      skillCount: skills.length,
    };
  }
}

export const neighborhoodService = new NeighborhoodService();
