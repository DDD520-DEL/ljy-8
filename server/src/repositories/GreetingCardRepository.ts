import { db } from '../utils/db';
import { GreetingCard, GreetingCardTemplate, GreetingCardTemplateCategory } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';

export class GreetingCardRepository {
  private cardCollection = 'greetingCards';
  private templateCollection = 'greetingCardTemplates';

  public findAllTemplates(): GreetingCardTemplate[] {
    return db
      .getAll<GreetingCardTemplate>(this.templateCollection)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public findTemplatesByCategory(category: GreetingCardTemplateCategory): GreetingCardTemplate[] {
    return db
      .findMany<GreetingCardTemplate>(this.templateCollection, (t) => t.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public findTemplateById(id: string): GreetingCardTemplate | undefined {
    return db.getById<GreetingCardTemplate>(this.templateCollection, id);
  }

  public createTemplate(template: Omit<GreetingCardTemplate, 'id'>): GreetingCardTemplate {
    const newTemplate: GreetingCardTemplate = {
      ...template,
      id: generateId(),
    };
    return db.insert<GreetingCardTemplate>(this.templateCollection, newTemplate);
  }

  public findReceivedCards(userId: string): GreetingCard[] {
    return db
      .findMany<GreetingCard>(this.cardCollection, (c) => c.receiverId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findSentCards(userId: string): GreetingCard[] {
    return db
      .findMany<GreetingCard>(this.cardCollection, (c) => c.senderId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findCardById(id: string): GreetingCard | undefined {
    return db.getById<GreetingCard>(this.cardCollection, id);
  }

  public createCard(data: {
    senderId: string;
    receiverId: string;
    template: GreetingCardTemplate;
    customMessage?: string;
    orderId?: string;
    orderType?: 'borrow' | 'service' | 'demand';
    itemTitle?: string;
  }): GreetingCard {
    const card: GreetingCard = {
      id: generateId(),
      senderId: data.senderId,
      receiverId: data.receiverId,
      templateId: data.template.id,
      templateTitle: data.template.title,
      templateContent: data.template.content,
      templateEmoji: data.template.emoji,
      templateBgColor: data.template.bgColor,
      templateTextColor: data.template.textColor,
      customMessage: data.customMessage,
      orderId: data.orderId,
      orderType: data.orderType,
      itemTitle: data.itemTitle,
      createdAt: getCurrentTime(),
    };
    return db.insert<GreetingCard>(this.cardCollection, card);
  }

  public countReceivedCards(userId: string): number {
    const cards = db.findMany<GreetingCard>(this.cardCollection, (c) => c.receiverId === userId);
    return cards.length;
  }

  public countSentCards(userId: string): number {
    const cards = db.findMany<GreetingCard>(this.cardCollection, (c) => c.senderId === userId);
    return cards.length;
  }

  public hasSentCardForOrder(orderId: string, senderId: string): boolean {
    const cards = db.findMany<GreetingCard>(
      this.cardCollection,
      (c) => c.orderId === orderId && c.senderId === senderId
    );
    return cards.length > 0;
  }
}

export const greetingCardRepository = new GreetingCardRepository();
