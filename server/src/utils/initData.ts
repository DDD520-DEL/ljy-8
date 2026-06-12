import { db } from './db';
import { generateId, getCurrentTime, getCreditLevel } from './helpers';
import * as bcrypt from 'bcryptjs';

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

const sampleUsers = [
  {
    id: 'user-admin',
    phone: '13800000000',
    email: 'admin@example.com',
    password: hashPassword('admin123'),
    nickname: '管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    creditScore: 95,
    creditLevel: 'S',
    timeCoins: 100,
    neighborhood: '阳光花园小区',
    role: 'admin' as const,
    createdAt: getCurrentTime(),
  },
  {
    id: 'user-zhang',
    phone: '13800000001',
    email: 'zhang@example.com',
    password: hashPassword('123456'),
    nickname: '张先生',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    creditScore: 88,
    creditLevel: 'A',
    timeCoins: 25,
    neighborhood: '阳光花园小区',
    role: 'user' as const,
    createdAt: getCurrentTime(),
  },
  {
    id: 'user-li',
    phone: '13800000002',
    email: 'li@example.com',
    password: hashPassword('123456'),
    nickname: '李女士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    creditScore: 92,
    creditLevel: 'A',
    timeCoins: 15,
    neighborhood: '阳光花园小区',
    role: 'user' as const,
    createdAt: getCurrentTime(),
  },
  {
    id: 'user-wang',
    phone: '13800000003',
    email: 'wang@example.com',
    password: hashPassword('123456'),
    nickname: '王师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    creditScore: 85,
    creditLevel: 'B',
    timeCoins: 30,
    neighborhood: '阳光花园小区',
    role: 'user' as const,
    createdAt: getCurrentTime(),
  },
  {
    id: 'user-chen',
    phone: '13800000004',
    email: 'chen@example.com',
    password: hashPassword('123456'),
    nickname: '陈老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
    creditScore: 90,
    creditLevel: 'A',
    timeCoins: 20,
    neighborhood: '阳光花园小区',
    role: 'user' as const,
    createdAt: getCurrentTime(),
  },
];

const sampleItems = [
  {
    id: 'item-1',
    ownerId: 'user-zhang',
    title: '博世电钻套装',
    description: '专业级电钻套装，含多种钻头，适合家装DIY使用。使用时请注意安全，戴好护目镜。',
    category: '工具',
    images: [] as string[],
    deposit: 200,
    borrowRules: '1. 请轻拿轻放，避免摔碰；2. 使用后请清洁干净；3. 如有损坏照价赔偿。',
    maxBorrowDays: 7,
    status: 'available' as const,
    viewCount: 42,
    createdAt: getCurrentTime(),
  },
  {
    id: 'item-2',
    ownerId: 'user-li',
    title: '空气炸锅',
    description: '美的空气炸锅，4.5L大容量，可以制作炸鸡、薯条、烤红薯等美食。',
    category: '家电',
    images: [] as string[],
    deposit: 150,
    borrowRules: '1. 使用前请阅读说明书；2. 请保持清洁；3. 请勿空烧。',
    maxBorrowDays: 3,
    status: 'available' as const,
    viewCount: 35,
    createdAt: getCurrentTime(),
  },
  {
    id: 'item-3',
    ownerId: 'user-wang',
    title: '专业工具箱套装',
    description: '128件综合工具箱，包含螺丝刀、扳手、钳子等各种常用工具。',
    category: '工具',
    images: [] as string[],
    deposit: 300,
    borrowRules: '1. 请按清单核对数量；2. 使用后请归位；3. 如有遗失按价赔偿。',
    maxBorrowDays: 14,
    status: 'available' as const,
    viewCount: 56,
    createdAt: getCurrentTime(),
  },
  {
    id: 'item-4',
    ownerId: 'user-chen',
    title: '羽毛球拍套装',
    description: '尤尼克斯羽毛球拍两支，附带三个羽毛球和球拍套。',
    category: '运动器材',
    images: [] as string[],
    deposit: 100,
    borrowRules: '1. 请勿用力摔拍；2. 使用后请擦拭干净；3. 羽毛球属消耗品。',
    maxBorrowDays: 5,
    status: 'available' as const,
    viewCount: 28,
    createdAt: getCurrentTime(),
  },
  {
    id: 'item-5',
    ownerId: 'user-zhang',
    title: '帐篷（4人）',
    description: '牧高笛四人帐篷，防风防雨，适合周末露营使用。',
    category: '运动器材',
    images: [] as string[],
    deposit: 250,
    borrowRules: '1. 请按说明正确搭建；2. 使用后请晾干再收纳；3. 如有破损请告知。',
    maxBorrowDays: 7,
    status: 'available' as const,
    viewCount: 45,
    createdAt: getCurrentTime(),
  },
  {
    id: 'item-6',
    ownerId: 'user-li',
    title: '编程书籍套装',
    description: 'JavaScript高级程序设计、CSS世界、深入浅出Node.js 共3本',
    category: '图书',
    images: [] as string[],
    deposit: 50,
    borrowRules: '1. 请爱护书籍，不要折页涂画；2. 请按时归还。',
    maxBorrowDays: 30,
    status: 'available' as const,
    viewCount: 20,
    createdAt: getCurrentTime(),
  },
];

const sampleSkills = [
  {
    id: 'skill-1',
    providerId: 'user-wang',
    title: '水电维修服务',
    description: '专业水电工，可处理水管漏水、电路故障、灯具安装等问题。拥有10年从业经验。',
    category: '维修服务',
    images: [] as string[],
    timeCoinPrice: 5,
    serviceDuration: 60,
    serviceArea: '阳光花园小区及周边1公里',
    status: 'active' as const,
    viewCount: 67,
    createdAt: getCurrentTime(),
  },
  {
    id: 'skill-2',
    providerId: 'user-li',
    title: '宠物代遛',
    description: '爱狗人士，可提供遛狗服务，每天早晚各一次，每次30分钟。',
    category: '家政服务',
    images: [] as string[],
    timeCoinPrice: 3,
    serviceDuration: 30,
    serviceArea: '阳光花园小区',
    status: 'active' as const,
    viewCount: 42,
    createdAt: getCurrentTime(),
  },
  {
    id: 'skill-3',
    providerId: 'user-chen',
    title: '吉他教学',
    description: '音乐专业毕业，有5年教学经验，可提供零基础入门教学。',
    category: '教学辅导',
    images: [] as string[],
    timeCoinPrice: 8,
    serviceDuration: 60,
    serviceArea: '阳光花园小区',
    status: 'active' as const,
    viewCount: 89,
    createdAt: getCurrentTime(),
  },
  {
    id: 'skill-4',
    providerId: 'user-zhang',
    title: '电脑维修',
    description: '可处理电脑系统安装、病毒查杀、硬件升级等问题。',
    category: '维修服务',
    images: [] as string[],
    timeCoinPrice: 4,
    serviceDuration: 60,
    serviceArea: '阳光花园小区',
    status: 'active' as const,
    viewCount: 34,
    createdAt: getCurrentTime(),
  },
  {
    id: 'skill-5',
    providerId: 'user-chen',
    title: '英语辅导',
    description: '英语专业八级，可提供中小学英语辅导、口语练习。',
    category: '教学辅导',
    images: [] as string[],
    timeCoinPrice: 6,
    serviceDuration: 60,
    serviceArea: '阳光花园小区',
    status: 'active' as const,
    viewCount: 56,
    createdAt: getCurrentTime(),
  },
  {
    id: 'skill-6',
    providerId: 'user-li',
    title: '家政清洁',
    description: '提供家庭日常清洁服务，包括扫地、拖地、擦窗户等。',
    category: '家政服务',
    images: [] as string[],
    timeCoinPrice: 5,
    serviceDuration: 120,
    serviceArea: '阳光花园小区',
    status: 'active' as const,
    viewCount: 78,
    createdAt: getCurrentTime(),
  },
];

export function initializeSampleData() {
  const collections = {
    users: sampleUsers,
    items: sampleItems,
    skills: sampleSkills,
    borrowOrders: [],
    serviceOrders: [],
    reviews: [],
    disputes: [],
  };

  db.initializeData(collections);

  console.log('✅ 示例数据初始化完成');
  console.log('   - 用户：' + sampleUsers.length + ' 个');
  console.log('   - 物品：' + sampleItems.length + ' 个');
  console.log('   - 技能：' + sampleSkills.length + ' 个');
  console.log('');
  console.log('📋 测试账号：');
  console.log('   管理员：admin@example.com / admin123');
  console.log('   普通用户：zhang@example.com / 123456');
  console.log('   普通用户：li@example.com / 123456');
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initializeSampleData();
  console.log('\n🚀 数据初始化完成！');
}
