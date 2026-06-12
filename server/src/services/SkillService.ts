import { skillRepository } from '../repositories/SkillRepository';
import { Skill, SkillWithProvider } from '../types';

export class SkillService {
  public getSkills(category?: string, keyword?: string): SkillWithProvider[] {
    let skills = skillRepository.findAll();
    
    if (category && category !== 'all') {
      skills = skills.filter(skill => skill.category === category);
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      skills = skills.filter(skill => 
        skill.title.toLowerCase().includes(lowerKeyword) ||
        skill.description.toLowerCase().includes(lowerKeyword)
      );
    }
    
    return skills.map(skill => skillRepository.toSkillWithProvider(skill));
  }

  public getSkillById(id: string): SkillWithProvider | null {
    const skill = skillRepository.findById(id);
    if (!skill) return null;
    skillRepository.incrementViewCount(id);
    return skillRepository.toSkillWithProvider(skill);
  }

  public getSkillsByProvider(providerId: string): SkillWithProvider[] {
    const skills = skillRepository.findByProviderId(providerId);
    return skills.map(skill => skillRepository.toSkillWithProvider(skill));
  }

  public createSkill(providerId: string, skillData: Omit<Skill, 'id' | 'providerId' | 'createdAt' | 'viewCount' | 'status'>): SkillWithProvider {
    const skill = skillRepository.create({ ...skillData, providerId });
    return skillRepository.toSkillWithProvider(skill);
  }

  public updateSkill(id: string, providerId: string, updates: Partial<Skill>): SkillWithProvider | null {
    const skill = skillRepository.findById(id);
    if (!skill || skill.providerId !== providerId) return null;
    
    const updated = skillRepository.update(id, updates);
    return updated ? skillRepository.toSkillWithProvider(updated) : null;
  }

  public updateSkillStatus(id: string, providerId: string, status: Skill['status']): SkillWithProvider | null {
    return this.updateSkill(id, providerId, { status });
  }
}

export const skillService = new SkillService();
