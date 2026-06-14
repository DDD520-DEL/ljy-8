

const CREDIT_LEVEL_ORDER: Record<string, number> = {
  'S': 6,
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'E': 1,
};

function compareCreditLevels(level1: string, level2: string): number {
  const l1 = CREDIT_LEVEL_ORDER[level1] || 0;
  const l2 = CREDIT_LEVEL_ORDER[level2] || 0;
  return l1 - l2;
}

function logTest(name: string, passed: boolean, detail?: string) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}${detail ? ` (${detail})` : ''}`);
}

function runTests() {
  console.log('========================================');
  console.log('  信用等级筛选逻辑测试');
  console.log('========================================\n');

  let passCount = 0;
  let failCount = 0;

  console.log('--- 单元测试：compareCreditLevels 函数 ---');

  const unitTests = [
    { level1: 'S', level2: 'A', expected: 1, desc: 'S > A' },
    { level1: 'A', level2: 'A', expected: 0, desc: 'A = A' },
    { level1: 'B', level2: 'A', expected: -1, desc: 'B < A' },
    { level1: 'S', level2: 'S', expected: 0, desc: 'S = S' },
    { level1: 'D', level2: 'B', expected: -2, desc: 'D < B' },
    { level1: 'A', level2: 'C', expected: 2, desc: 'A > C' },
  ];

  unitTests.forEach(test => {
    const result = compareCreditLevels(test.level1, test.level2);
    const passed = result === test.expected;
    logTest(
      test.desc,
      passed,
      `${test.level1} vs ${test.level2} = ${result} (expected ${test.expected})`
    );
    passed ? passCount++ : failCount++;
  });

  console.log('\n--- 业务逻辑测试：筛选语义验证 ---');

  console.log('\n筛选语义说明：');
  console.log('  用户选择「A级及以上」表示要找"要求 A级及以上信用"的物品');
  console.log('  即：物品要求 >= 用户选择的等级门槛');
  console.log('  S级物品(要求最高) → 应该被包含');
  console.log('  A级物品           → 应该被包含');
  console.log('  B级物品           → 不应该被包含');
  console.log('');

  const filterTests = [
    {
      name: '筛选 "S级及以上" 应只包含 S 级物品',
      filterLevel: 'S',
      items: [
        { id: '1', minCreditLevel: 'S' as const, title: 'S级物品' },
        { id: '2', minCreditLevel: 'A' as const, title: 'A级物品' },
        { id: '3', minCreditLevel: 'B' as const, title: 'B级物品' },
      ],
      expectedCount: 1,
      expectedIds: ['1'],
    },
    {
      name: '筛选 "A级及以上" 应包含 S/A 级物品',
      filterLevel: 'A',
      items: [
        { id: '1', minCreditLevel: 'S' as const, title: 'S级物品' },
        { id: '2', minCreditLevel: 'A' as const, title: 'A级物品' },
        { id: '3', minCreditLevel: 'B' as const, title: 'B级物品' },
      ],
      expectedCount: 2,
      expectedIds: ['1', '2'],
    },
    {
      name: '筛选 "B级及以上" 应包含 S/A/B 级物品',
      filterLevel: 'B',
      items: [
        { id: '1', minCreditLevel: 'S' as const, title: 'S级物品' },
        { id: '2', minCreditLevel: 'A' as const, title: 'A级物品' },
        { id: '3', minCreditLevel: 'B' as const, title: 'B级物品' },
        { id: '4', minCreditLevel: 'C' as const, title: 'C级物品' },
      ],
      expectedCount: 3,
      expectedIds: ['1', '2', '3'],
    },
    {
      name: '筛选 "C级及以上" 应包含 S/A/B/C 级物品',
      filterLevel: 'C',
      items: [
        { id: '1', minCreditLevel: 'S' as const, title: 'S级物品' },
        { id: '2', minCreditLevel: 'A' as const, title: 'A级物品' },
        { id: '3', minCreditLevel: 'B' as const, title: 'B级物品' },
        { id: '4', minCreditLevel: 'C' as const, title: 'C级物品' },
        { id: '5', minCreditLevel: 'D' as const, title: 'D级物品' },
      ],
      expectedCount: 4,
      expectedIds: ['1', '2', '3', '4'],
    },
    {
      name: '筛选 "D级及以上" 应包含所有等级物品',
      filterLevel: 'D',
      items: [
        { id: '1', minCreditLevel: 'S' as const, title: 'S级物品' },
        { id: '2', minCreditLevel: 'A' as const, title: 'A级物品' },
        { id: '3', minCreditLevel: 'B' as const, title: 'B级物品' },
        { id: '4', minCreditLevel: 'C' as const, title: 'C级物品' },
        { id: '5', minCreditLevel: 'D' as const, title: 'D级物品' },
      ],
      expectedCount: 5,
      expectedIds: ['1', '2', '3', '4', '5'],
    },
  ];

  filterTests.forEach(test => {
    const filtered = test.items.filter(item => {
      return compareCreditLevels(item.minCreditLevel, test.filterLevel) >= 0;
    });
    const countPassed = filtered.length === test.expectedCount;
    const idsPassed = filtered.every(item => test.expectedIds.includes(item.id))
      && test.expectedIds.every(id => filtered.some(item => item.id === id));
    const passed = countPassed && idsPassed;

    logTest(
      test.name,
      passed,
      `返回 ${filtered.length} 条 (预期 ${test.expectedCount} 条), IDs: [${filtered.map(i => i.id).join(', ')}]`
    );
    passed ? passCount++ : failCount++;
  });

  console.log('\n--- 反例验证：旧逻辑 (<= 0) 的错误结果 ---');

  const bugDemoTests = [
    {
      name: '【旧逻辑BUG】筛选 "A级及以上" 错误地包含了 B/C/D 级',
      filterLevel: 'A',
      items: [
        { id: '1', minCreditLevel: 'S' as const, title: 'S级物品' },
        { id: '2', minCreditLevel: 'A' as const, title: 'A级物品' },
        { id: '3', minCreditLevel: 'B' as const, title: 'B级物品' },
        { id: '4', minCreditLevel: 'C' as const, title: 'C级物品' },
      ],
    },
  ];

  bugDemoTests.forEach(test => {
    const oldFiltered = test.items.filter(item => {
      return compareCreditLevels(item.minCreditLevel, test.filterLevel) <= 0;
    });
    const newFiltered = test.items.filter(item => {
      return compareCreditLevels(item.minCreditLevel, test.filterLevel) >= 0;
    });

    console.log(`\n${test.name}`);
    console.log(`  旧逻辑 (<= 0) 返回: [${oldFiltered.map(i => i.minCreditLevel).join(', ')}] (共 ${oldFiltered.length} 条)`);
    console.log(`  新逻辑 (>= 0) 返回: [${newFiltered.map(i => i.minCreditLevel).join(', ')}] (共 ${newFiltered.length} 条)`);
    console.log(`  预期: 应该只包含 S, A 级 (共 2 条)`);
  });

  console.log('\n========================================');
  console.log(`  测试结果: ${passCount} 通过, ${failCount} 失败`);
  console.log('========================================');

  return failCount === 0;
}

const allPassed = runTests();
process.exit(allPassed ? 0 : 1);
