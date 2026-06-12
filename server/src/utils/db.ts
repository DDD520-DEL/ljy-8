import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

export class JsonDatabase {
  private static instance: JsonDatabase;
  private data: Map<string, any[]> = new Map();
  private filePath: string;

  private constructor() {
    this.filePath = path.join(DATA_DIR, 'db.json');
    this.ensureDataDir();
    this.loadData();
  }

  public static getInstance(): JsonDatabase {
    if (!JsonDatabase.instance) {
      JsonDatabase.instance = new JsonDatabase();
    }
    return JsonDatabase.instance;
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        Object.keys(parsed).forEach(key => {
          this.data.set(key, parsed[key]);
        });
      } catch (err) {
        console.error('Error loading database:', err);
      }
    }
  }

  private saveData(): void {
    const dataObj: Record<string, any[]> = {};
    this.data.forEach((value, key) => {
      dataObj[key] = value;
    });
    fs.writeFileSync(this.filePath, JSON.stringify(dataObj, null, 2), 'utf-8');
  }

  public getAll<T>(collection: string): T[] {
    return (this.data.get(collection) || []) as T[];
  }

  public getById<T>(collection: string, id: string): T | undefined {
    const items = this.getAll<T>(collection);
    return items.find((item: any) => item.id === id);
  }

  public findOne<T>(collection: string, predicate: (item: T) => boolean): T | undefined {
    const items = this.getAll<T>(collection);
    return items.find(predicate);
  }

  public findMany<T>(collection: string, predicate: (item: T) => boolean): T[] {
    const items = this.getAll<T>(collection);
    return items.filter(predicate);
  }

  public insert<T>(collection: string, item: T): T {
    const items = this.getAll<T>(collection);
    items.push(item);
    this.data.set(collection, items);
    this.saveData();
    return item;
  }

  public update<T>(collection: string, id: string, updates: Partial<T>): T | undefined {
    const items = this.getAll<any>(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...updates };
    this.data.set(collection, items);
    this.saveData();
    return items[index] as T;
  }

  public delete(collection: string, id: string): boolean {
    const items = this.getAll<any>(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    this.data.set(collection, items);
    this.saveData();
    return true;
  }

  public initializeData(initialData: Record<string, any[]>): void {
    Object.keys(initialData).forEach(key => {
      if (!this.data.has(key)) {
        this.data.set(key, initialData[key]);
      }
    });
    this.saveData();
  }
}

export const db = JsonDatabase.getInstance();
