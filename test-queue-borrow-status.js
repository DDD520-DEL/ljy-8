/**
 * ============================================================
 * 测试用例：物品预约排队功能 - 状态流转完整性验证
 * ============================================================
 *
 * 测试目标：
 * 1. 验证排队确认借用后物品状态正确更新为 borrowed（防止重复借用）
 * 2. 验证订单状态正确流转为 borrowing
 * 3. 验证排队记录状态正确更新为 borrowed
 * 4. 验证在物品已借出时其他用户无法通过直接借用入口下单
 * 5. 验证完整的生命周期（借出 -> 排队 -> 确认 -> 归还 -> 下一位通知）
 *
 * 测试流程：
 * ┌─────────────┐
 * │ 初始状态    │ item-5 (帐篷) 状态: available, owner: user-zhang
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  李女士(li)申请借用 → 批准 → 借出
 * │ 步骤1       │  物品状态: borrowed, 订单状态: borrowing
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  王师傅(wang)加入排队(排位1)  陈老师(chen)加入排队(排位2)
 * │ 步骤2       │  验证两人状态均为 waiting
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  张先生(zhang)确认归还
 * │ 步骤3       │  物品状态: available
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  王师傅(wang)被通知  王师傅状态: notified  设置24h过期
 * │ 步骤4       │  陈老师(chen)仍为 waiting(排位2)  王师傅收到 queue_turn 通知
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  王师傅(wang)通过排队确认借用
 * │ 步骤5       │  ✅ 物品状态: borrowed (核心修复点)
 * │ (核心验证)  │  ✅ 订单状态: borrowing
 * │             │  ✅ 排队状态: borrowed
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  陈老师(chen)尝试直接借用 item-5 (非排队入口)
 * │ 步骤6       │  ✅ 应该失败："物品不可借用"
 * │ (防重复)    │
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  张先生(zhang)再次确认归还
 * │ 步骤7       │  物品状态: available
 * └──────┬──────┘
 *        ▼
 * ┌─────────────┐  陈老师(chen)被自动通知(顺延)
 * │ 步骤8       │  陈老师状态: notified  陈老师收到 queue_turn 通知
 * └─────────────┘
 *
 * ============================================================
 */

const BASE_URL = 'http://localhost:3002/api';
const ITEM_ID = 'item-5';
const ITEM_NAME = '帐篷（4人）';
const OWNER_PHONE = '13800000001'; // user-zhang 张先生
const BORROWER1_PHONE = '13800000002'; // user-li 李女士（首次借出人）
const QUEUE_USER1_PHONE = '13800000003'; // user-wang 王师傅（排队第1位）
const QUEUE_USER2_PHONE = '13800000004'; // user-chen 陈老师（排队第2位）
const PASSWORD = '123456';

let passed = 0;
let failed = 0;
const testResults = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
    testResults.push({ name, status: 'PASS' });
  } catch (err) {
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`     Error: ${err.message}`);
    failed++;
    testResults.push({ name, status: 'FAIL', error: err.message });
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || ''} - 期望: ${expected}, 实际: ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || '值不能为空');
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const fetchOptions = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };
  const resp = await fetch(url, fetchOptions);
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: resp.status, ok: resp.ok, data, raw: data };
}

function auth(token) { return { Authorization: `Bearer ${token}` }; }

const today = new Date();
const in3Days = new Date(today); in3Days.setDate(in3Days.getDate() + 3);
const fmt = (d) => d.toISOString().split('T')[0];

async function login(phone) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { phone, password: PASSWORD }
  });
  if (!res.ok) throw new Error(`登录失败: ${phone}`);
  return res.data.data.token;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  物品预约排队功能 - 状态流转完整性验证测试用例');
  console.log('='.repeat(70));

  // 登录所有用户
  console.log('\n【初始化】登录所有测试用户...');
  const tokens = {
    owner: await login(OWNER_PHONE),       // 张先生(物主)
    borrower1: await login(BORROWER1_PHONE), // 李女士(首次借用人)
    queue1: await login(QUEUE_USER1_PHONE),  // 王师傅(排队1)
    queue2: await login(QUEUE_USER2_PHONE),  // 陈老师(排队2)
  };
  console.log('  ✅ 所有用户登录成功');

  // ============ 步骤1：李女士借用帐篷 ============
  console.log('\n【步骤1】李女士申请并借用帐篷...');
  const step1Res = await request('/orders/borrow', {
    method: 'POST',
    headers: auth(tokens.borrower1),
    body: { itemId: ITEM_ID, startDate: fmt(today), endDate: fmt(in3Days), message: '周末露营' }
  });
  assertEqual(step1Res.status, 201, '借用申请创建');
  const firstOrder = step1Res.data.data;
  assertNotNull(firstOrder.id, '订单ID');

  // 张先生(物主)批准
  await request(`/orders/borrow/${firstOrder.id}/approve`, {
    method: 'PUT', headers: auth(tokens.owner)
  });
  // 张先生确认借出
  await request(`/orders/borrow/${firstOrder.id}/lend`, {
    method: 'PUT', headers: auth(tokens.owner)
  });

  const itemAfterLend = (await request(`/items/${ITEM_ID}`)).data.data;
  test('首次借出后物品状态 = borrowed', () => {
    assertEqual(itemAfterLend.status, 'borrowed');
  });
  const orderAfterLend = (await request(`/orders/borrow/${firstOrder.id}`, { headers: auth(tokens.owner) })).data.data;
  test('首次借出后订单状态 = borrowing', () => {
    assertEqual(orderAfterLend.status, 'borrowing');
  });

  // ============ 步骤2：王师傅、陈老师加入排队 ============
  console.log('\n【步骤2】王师傅、陈老师加入等待队列...');

  const wangQueueRes = await request('/queue', {
    method: 'POST',
    headers: auth(tokens.queue1),
    body: { itemId: ITEM_ID, message: '等李女士用完' }
  });
  const wangQueue = wangQueueRes.data.data;
  test('王师傅加入排队成功 - 排位=1', () => assertEqual(wangQueue.position, 1));
  test('王师傅排队状态 = waiting', () => assertEqual(wangQueue.status, 'waiting'));

  const chenQueueRes = await request('/queue', {
    method: 'POST',
    headers: auth(tokens.queue2),
    body: { itemId: ITEM_ID, message: '排队第二位' }
  });
  const chenQueue = chenQueueRes.data.data;
  test('陈老师加入排队成功 - 排位=2', () => assertEqual(chenQueue.position, 2));
  test('陈老师排队状态 = waiting', () => assertEqual(chenQueue.status, 'waiting'));

  const queueList = (await request(`/queue/item/${ITEM_ID}`, { headers: auth(tokens.owner) })).data.data;
  test('排队列表总人数 = 2', () => assertEqual(queueList.length, 2));

  // 王师傅此时没有未读通知
  const wangUnread0 = (await request('/queue/notifications/unread-count', { headers: auth(tokens.queue1) })).data.data;
  test('借出期间王师傅未读通知数 = 0', () => assertEqual(wangUnread0.count, 0));

  // ============ 步骤3：张先生确认物品归还 ============
  console.log('\n【步骤3】张先生确认李女士归还物品...');
  await request(`/orders/borrow/${firstOrder.id}/return`, {
    method: 'PUT',
    headers: auth(tokens.owner),
    body: { condition: '物品完好无损' }
  });

  const itemAfterReturn = (await request(`/items/${ITEM_ID}`)).data.data;
  test('归还后物品状态 = available', () => assertEqual(itemAfterReturn.status, 'available'));
  const orderAfterReturn = (await request(`/orders/borrow/${firstOrder.id}`, { headers: auth(tokens.owner) })).data.data;
  test('归还后订单状态 = returned', () => assertEqual(orderAfterReturn.status, 'returned'));

  // ============ 步骤4：自动通知王师傅 ============
  console.log('\n【步骤4】验证自动通知王师傅（排队第1位）...');
  await new Promise(r => setTimeout(r, 500));

  const wangQueueAfterNotify = (await request('/queue/my', { headers: auth(tokens.queue1) })).data.data[0];
  test('王师傅排队状态自动变为 notified', () => assertEqual(wangQueueAfterNotify.status, 'notified'));
  test('王师傅排位仍为 1', () => assertEqual(wangQueueAfterNotify.position, 1));
  test('王师傅通知时间已设置', () => assertNotNull(wangQueueAfterNotify.notifiedAt));
  test('王师傅过期时间已设置(24小时后)', () => assertNotNull(wangQueueAfterNotify.expiredAt));

  const chenQueueAfterNotify = (await request('/queue/my', { headers: auth(tokens.queue2) })).data.data[0];
  test('陈老师排队状态保持 waiting', () => assertEqual(chenQueueAfterNotify.status, 'waiting'));
  test('陈老师排位保持 2', () => assertEqual(chenQueueAfterNotify.position, 2));

  const wangNotifs = (await request('/queue/notifications', { headers: auth(tokens.queue1) })).data.data;
  test('王师傅收到 1 条通知', () => assertEqual(wangNotifs.length, 1));
  test('通知类型 = queue_turn', () => assertEqual(wangNotifs[0].type, 'queue_turn'));
  test('通知未读标记 = true', () => assertEqual(wangNotifs[0].read, false));

  const wangUnread1 = (await request('/queue/notifications/unread-count', { headers: auth(tokens.queue1) })).data.data;
  test('王师傅未读通知数 = 1', () => assertEqual(wangUnread1.count, 1));

  // ============ 步骤5：王师傅确认借用 - 【核心验证点】============
  console.log('\n【步骤5】王师傅通过排队确认借用（核心状态验证）...');
  console.log('  ⚠️  核心修复点：物品状态应同步标记为 borrowed');

  const confirmRes = await request(`/queue/${wangQueueAfterNotify.id}/confirm`, {
    method: 'PUT',
    headers: auth(tokens.queue1),
    body: { startDate: fmt(today), endDate: fmt(in3Days) }
  });
  assertEqual(confirmRes.status, 200, '排队确认借用请求成功');
  const confirmedQueue = confirmRes.data.data;

  // 🔴 🔴 🔴 核心验证：排队确认借用后物品状态
  const itemAfterQueueConfirm = (await request(`/items/${ITEM_ID}`)).data.data;
  test('【核心修复验证】排队确认借用后 物品状态 = borrowed', () => {
    assertEqual(itemAfterQueueConfirm.status, 'borrowed');
  });

  // 同时验证订单状态
  const wangOrders = (await request('/orders/borrow?role=borrower', { headers: auth(tokens.queue1) })).data.data;
  const latestWangOrder = wangOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  assertNotNull(latestWangOrder, '王师傅最新订单存在');
  test('排队确认借用后 订单状态 = borrowing', () => {
    assertEqual(latestWangOrder.status, 'borrowing');
  });
  test('订单借用人 = 王师傅(user-wang)', () => {
    assertEqual(latestWangOrder.borrowerId, 'user-wang');
  });

  // 验证排队记录状态
  const wangQueueFinal = (await request('/queue/my', { headers: auth(tokens.queue1) })).data.data[0];
  test('排队确认借用后 排队记录状态 = borrowed', () => {
    assertEqual(wangQueueFinal.status, 'borrowed');
  });

  // ============ 步骤6：验证防重复借用 ============
  console.log('\n【步骤6】验证：物品已借出时其他用户无法直接借用...');

  const directBorrowAttempt = await request('/orders/borrow', {
    method: 'POST',
    headers: auth(tokens.queue2), // 陈老师尝试直接借用
    body: { itemId: ITEM_ID, startDate: fmt(today), endDate: fmt(in3Days) }
  });
  test('陈老师直接借用应失败(HTTP 400)', () => {
    assertEqual(directBorrowAttempt.status, 400);
  });
  test('错误消息 = "物品不可借用"', () => {
    assertEqual(directBorrowAttempt.data.message, '物品不可借用');
  });

  // 尝试加入排队也应该失败（因为陈老师已经在排队）
  const duplicateQueueAttempt = await request('/queue', {
    method: 'POST',
    headers: auth(tokens.queue2),
    body: { itemId: ITEM_ID }
  });
  test('陈老师重复加入排队应失败(HTTP 400)', () => {
    assertEqual(duplicateQueueAttempt.status, 400);
  });

  // ============ 步骤7：王师傅确认归还物品 ============
  console.log('\n【步骤7】张先生确认王师傅归还物品...');
  await request(`/orders/borrow/${latestWangOrder.id}/return`, {
    method: 'PUT',
    headers: auth(tokens.owner),
    body: { condition: '帐篷完好' }
  });
  const itemAfterReturn2 = (await request(`/items/${ITEM_ID}`)).data.data;
  test('王师傅归还后物品状态 = available', () => {
    assertEqual(itemAfterReturn2.status, 'available');
  });

  // ============ 步骤8：陈老师自动顺延被通知 ============
  console.log('\n【步骤8】验证顺延通知：陈老师自动被通知...');
  await new Promise(r => setTimeout(r, 500));

  const chenQueueFinal = (await request('/queue/my', { headers: auth(tokens.queue2) })).data.data[0];
  test('陈老师排位自动前移为 1', () => assertEqual(chenQueueFinal.position, 1));
  test('陈老师状态自动变为 notified', () => assertEqual(chenQueueFinal.status, 'notified'));

  const chenNotifs = (await request('/queue/notifications', { headers: auth(tokens.queue2) })).data.data;
  const chenTurnNotif = chenNotifs.find(n => n.type === 'queue_turn');
  test('陈老师收到 queue_turn 顺延通知', () => assertNotNull(chenTurnNotif));

  // ============ 汇总输出 ============
  console.log('\n' + '='.repeat(70));
  console.log('  测试结果汇总');
  console.log('='.repeat(70));
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  📊 总计: ${passed + failed}`);

  if (failed > 0) {
    console.log('\n  失败用例详情:');
    testResults.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`    - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n  🎉 所有测试用例全部通过！');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\n❌ 测试执行异常:', err.message);
  console.error(err.stack);
  process.exit(2);
});
