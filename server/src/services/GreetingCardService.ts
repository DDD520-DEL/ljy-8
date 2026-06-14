import { greetingCardRepository } from '../repositories/GreetingCardRepository';
import { userRepository } from '../repositories/UserRepository';
import { notificationService } from './NotificationService';
import {
  GreetingCard,
  GreetingCardTemplate,
  GreetingCardWithDetails,
  GreetingCardTemplateCategory,
} from '../types';

export class GreetingCardService {
  public getTemplates(category?: GreetingCardTemplateCategory): GreetingCardTemplate[] {
    if (category) {
      return greetingCardRepository.findTemplatesByCategory(category);
    }
    return greetingCardRepository.findAllTemplates();
  }

  public getTemplateById(id: string): GreetingCardTemplate | undefined {
    return greetingCardRepository.findTemplateById(id);
  }

  public getReceivedCards(userId: string): GreetingCardWithDetails[] {
    const cards = greetingCardRepository.findReceivedCards(userId);
    return cards.map((card) => this.enrichCardWithDetails(card));
  }

  public getSentCards(userId: string): GreetingCardWithDetails[] {
    const cards = greetingCardRepository.findSentCards(userId);
    return cards.map((card) => this.enrichCardWithDetails(card));
  }

  public getCardById(id: string): GreetingCardWithDetails | null {
    const card = greetingCardRepository.findCardById(id);
    if (!card) return null;
    return this.enrichCardWithDetails(card);
  }

  public sendCard(data: {
    senderId: string;
    receiverId: string;
    templateId: string;
    customMessage?: string;
    orderId?: string;
    orderType?: 'borrow' | 'service' | 'demand';
    itemTitle?: string;
  }): GreetingCardWithDetails {
    const template = greetingCardRepository.findTemplateById(data.templateId);
    if (!template) {
      throw new Error('卡片模板不存在');
    }

    const sender = userRepository.findById(data.senderId);
    const receiver = userRepository.findById(data.receiverId);
    if (!sender || !receiver) {
      throw new Error('用户不存在');
    }

    if (data.orderId && greetingCardRepository.hasSentCardForOrder(data.orderId, data.senderId)) {
      throw new Error('该订单已发送过感谢卡片');
    }

    const card = greetingCardRepository.createCard({
      senderId: data.senderId,
      receiverId: data.receiverId,
      template,
      customMessage: data.customMessage,
      orderId: data.orderId,
      orderType: data.orderType,
      itemTitle: data.itemTitle,
    });

    notificationService.sendNotification({
      userId: data.receiverId,
      type: 'greeting_card_received',
      title: '收到一张感谢卡片',
      message: `${sender.nickname} 给您发送了一张「${template.title}」感谢卡片`,
      relatedId: card.id,
      relatedType: 'item',
    });

    return this.enrichCardWithDetails(card);
  }

  public getReceivedCount(userId: string): number {
    return greetingCardRepository.countReceivedCards(userId);
  }

  public getSentCount(userId: string): number {
    return greetingCardRepository.countSentCards(userId);
  }

  public hasSentCardForOrder(orderId: string, senderId: string): boolean {
    return greetingCardRepository.hasSentCardForOrder(orderId, senderId);
  }

  private enrichCardWithDetails(card: GreetingCard): GreetingCardWithDetails {
    const sender = userRepository.findById(card.senderId);
    const receiver = userRepository.findById(card.receiverId);

    return {
      ...card,
      sender: sender ? userRepository.toPublicUser(sender) : ({} as any),
      receiver: receiver ? userRepository.toPublicUser(receiver) : ({} as any),
    };
  }
}

export const greetingCardService = new GreetingCardService();
