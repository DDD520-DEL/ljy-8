import { db } from '../utils/db';
import { Skill, SkillWithProvider } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class SkillRepository {
  private collection = 'skills';

  public findAll(): Skill[] {
    return db.getAll<Skill>(this.collection);
  }

  public findById(id: string): Skill | undefined {
    return db.getById<Skill>(this.collection, id);
  }

  public findByProviderId(providerId: string): Skill[] {
    return db.findMany<Skill>(this.collection, (skill) => skill.providerId === providerId);
  }

  public findByCategory(category: string): Skill[] {
    if (category === 'all') return this.findAll();
    return db.findMany<Skill>(this.collection, (skill) => skill.category === category && skill.status === 'active');
  }

  public create(skillData: Omit<Skill, 'id' | 'createdAt' | 'viewCount' | 'status'>): Skill {
    const skill: Skill = {
      id: generateId(),
      ...skillData,
      status: 'active',
      viewCount: 0,
      createdAt: getCurrentTime(),
    };
    return db.insert<Skill>(this.collection, skill);
  }

  public update(id: string, updates: Partial<Skill>): Skill | undefined {
    return db.update<Skill>(this.collection, id, updates);
  }

  public incrementViewCount(id: string): void {
    const skill = this.findById(id);
    if (skill) {
      this.update(id, { viewCount: skill.viewCount + 1 });
    }
  }

  public toSkillWithProvider(skill: Skill): SkillWithProvider {
    const provider = userRepository.findById(skill.providerId);
    return {
      ...skill,
      provider: provider ? userRepository.toPublicUser(provider) : {} as any,
    };
  }
}

export const skillRepository = new SkillRepository();
