import { useEffect, useState } from 'react';
import { statsApi } from '../api';
import type { DashboardStats } from '../types';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const res = await statsApi.getDashboardStats();
    if (res.success) {
      setStats(res.data);
    }
    setLoading(false);
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝',
    borrowing: '借用中',
    returned: '已归还',
    in_progress: '进行中',
    completed: '已完成',
    disputed: '有纠纷',
  };

  const statusColors: Record<string, string> = {
    pending: '#faad14',
    approved: '#1890ff',
    rejected: '#ff4d4f',
    borrowing: '#722ed1',
    returned: '#52c41a',
    in_progress: '#13c2c2',
    completed: '#52c41a',
    disputed: '#ff4d4f',
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  const BarChart = ({
    data,
    title,
    color = '#667eea',
    height = 200,
  }: {
    data: { label: string; value: number }[];
    title: string;
    color?: string;
    height?: number;
  }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <div className="bar-chart" style={{ height }}>
          {data.map((item, index) => (
            <div key={index} className="bar-item">
              <div className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    background: color,
                  }}
                >
                  <span className="bar-value">{item.value}</span>
                </div>
              </div>
              <span className="bar-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChart = ({
    data,
    title,
  }: {
    data: { label: string; value: number; color: string }[];
    title: string;
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    const getConicGradient = () => {
      let gradient = 'conic-gradient(';
      const parts: string[] = [];
      let start = 0;

      data.forEach((item) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const end = start + percentage;
        parts.push(`${item.color} ${start}% ${end}%`);
        start = end;
      });

      gradient += parts.join(', ') + ')';
      return gradient;
    };

    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <div className="pie-chart-container">
          <div className="pie-chart" style={{ background: getConicGradient() }}>
            <div className="pie-center">
              <span className="pie-total">{total}</span>
              <span className="pie-label">总计</span>
            </div>
          </div>
          <div className="pie-legend">
            {data.map((item, index) => (
              <div key={index} className="legend-item">
                <span
                  className="legend-color"
                  style={{ background: item.color }}
                ></span>
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">
                  {item.value} (
                  {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const LineChart = ({
    data,
    title,
    height = 200,
  }: {
    data: { month: string; income: number; expenditure: number }[];
    title: string;
    height?: number;
  }) => {
    const maxValue = Math.max(
      ...data.flatMap((d) => [d.income, d.expenditure]),
      1
    );

    const generatePath = (values: number[]) => {
      const width = 100;
      const chartHeight = 100;
      const points = values.map((value, index) => {
        const x = (index / (values.length - 1 || 1)) * width;
        const y = chartHeight - (value / maxValue) * chartHeight;
        return `${x},${y}`;
      });
      return `M ${points.join(' L ')}`;
    };

    const incomeValues = data.map((d) => d.income);
    const expenditureValues = data.map((d) => d.expenditure);

    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <div className="line-chart-container" style={{ height }}>
          <svg
            className="line-chart"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="25"
              x2="100"
              y2="25"
              stroke="#f0f0f0"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="#f0f0f0"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="75"
              x2="100"
              y2="75"
              stroke="#f0f0f0"
              strokeWidth="0.5"
            />
            <path
              d={generatePath(incomeValues)}
              fill="none"
              stroke="#52c41a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={generatePath(expenditureValues)}
              fill="none"
              stroke="#ff4d4f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {incomeValues.map((value, index) => {
              const x = (index / (incomeValues.length - 1 || 1)) * 100;
              const y = 100 - (value / maxValue) * 100;
              return (
                <circle
                  key={`income-${index}`}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#52c41a"
                />
              );
            })}
            {expenditureValues.map((value, index) => {
              const x =
                (index / (expenditureValues.length - 1 || 1)) * 100;
              const y = 100 - (value / maxValue) * 100;
              return (
                <circle
                  key={`expenditure-${index}`}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#ff4d4f"
                />
              );
            })}
          </svg>
          <div className="line-chart-labels">
            {data.map((item, index) => (
              <span key={index} className="line-label">
                {item.month.split('-')[1]}月
              </span>
            ))}
          </div>
        </div>
        <div className="line-chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#52c41a' }}></span>
            <span className="legend-text">收入</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ff4d4f' }}></span>
            <span className="legend-text">支出</span>
          </div>
        </div>
      </div>
    );
  };

  const getBorrowOrderChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.borrowOrderStats).map(([key, value]) => ({
      label: statusLabels[key] || key,
      value,
      color: statusColors[key] || '#999',
    }));
  };

  const getServiceOrderChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.serviceOrderStats).map(([key, value]) => ({
      label: statusLabels[key] || key,
      value,
      color: statusColors[key] || '#999',
    }));
  };

  const getCategoryChartData = (
    categories: Record<string, number>,
    colors: string[]
  ) => {
    return Object.entries(categories).map(([key, value], index) => ({
      label: key,
      value,
      color: colors[index % colors.length],
    }));
  };

  const categoryColors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#30cfd0',
  ];

  if (loading) {
    return (
      <div className="container admin-dashboard">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container admin-dashboard">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-dashboard">
      <div className="page-header">
        <h1>管理员数据看板</h1>
        <p className="page-subtitle">平台运营数据概览</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="注册用户数"
          value={stats.totalUsers}
          icon="👥"
          color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          subtitle="总注册用户"
        />
        <StatCard
          title="在架物品数"
          value={stats.availableItems}
          icon="📦"
          color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          subtitle={`共 ${stats.totalItems} 件物品`}
        />
        <StatCard
          title="可服务技能数"
          value={stats.activeSkills}
          icon="🛠️"
          color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          subtitle={`共 ${stats.totalSkills} 项技能`}
        />
        <StatCard
          title="纠纷处理率"
          value={`${stats.disputeStats.resolutionRate}%`}
          icon="⚖️"
          color="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          subtitle={`已解决 ${stats.disputeStats.resolved} / 共 ${stats.disputeStats.total}`}
        />
      </div>

      <div className="charts-row">
        <PieChart
          title="借用订单状态分布"
          data={getBorrowOrderChartData()}
        />
        <PieChart
          title="服务订单状态分布"
          data={getServiceOrderChartData()}
        />
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">月度时间币流通量</h3>
          <div className="timecoin-stats">
            <div className="timecoin-stat income">
              <span className="timecoin-label">本月收入</span>
              <span className="timecoin-value">
                ⏰ {stats.monthlyTimeCoinFlow.income}
              </span>
            </div>
            <div className="timecoin-stat expenditure">
              <span className="timecoin-label">本月支出</span>
              <span className="timecoin-value">
                ⏰ {stats.monthlyTimeCoinFlow.expenditure}
              </span>
            </div>
            <div className="timecoin-stat total">
              <span className="timecoin-label">总流通量</span>
              <span className="timecoin-value">
                ⏰ {stats.monthlyTimeCoinFlow.total}
              </span>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">纠纷处理统计</h3>
          <div className="dispute-stats">
            <div className="dispute-stat-item">
              <span className="dispute-stat-value" style={{ color: '#1890ff' }}>
                {stats.disputeStats.total}
              </span>
              <span className="dispute-stat-label">总纠纷数</span>
            </div>
            <div className="dispute-stat-item">
              <span className="dispute-stat-value" style={{ color: '#52c41a' }}>
                {stats.disputeStats.resolved}
              </span>
              <span className="dispute-stat-label">已解决</span>
            </div>
            <div className="dispute-stat-item">
              <span className="dispute-stat-value" style={{ color: '#faad14' }}>
                {stats.disputeStats.pending}
              </span>
              <span className="dispute-stat-label">待处理</span>
            </div>
            <div className="dispute-stat-item">
              <span
                className="dispute-stat-value"
                style={{ color: '#722ed1' }}
              >
                {stats.disputeStats.resolutionRate}%
              </span>
              <span className="dispute-stat-label">处理率</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <LineChart title="时间币流通趋势" data={stats.recentMonthlyTrend} />
        <BarChart
          title="用户增长趋势"
          data={stats.userGrowth.map((item) => ({
            label: item.month.split('-')[1] + '月',
            value: item.count,
          }))}
          color="#667eea"
        />
      </div>

      <div className="charts-row">
        <PieChart
          title="物品分类分布"
          data={getCategoryChartData(
            stats.categoryStats.itemCategories,
            categoryColors
          )}
        />
        <PieChart
          title="技能分类分布"
          data={getCategoryChartData(
            stats.categoryStats.skillCategories,
            categoryColors
          )}
        />
      </div>

      <style>{`
        .admin-dashboard {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 4px;
        }
        .page-subtitle {
          color: #999;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .stat-content {
          flex: 1;
          min-width: 0;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #333;
        }
        .stat-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 2px;
        }
        .stat-subtitle {
          font-size: 12px;
          color: #999;
        }
        .charts-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .chart-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 16px;
          color: #333;
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 12px;
          padding: 0 8px;
        }
        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .bar-wrapper {
          flex: 1;
          width: 100%;
          max-width: 40px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          position: relative;
          min-height: 4px;
          transition: height 0.5s ease;
        }
        .bar-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          color: #666;
          white-space: nowrap;
        }
        .bar-label {
          margin-top: 8px;
          font-size: 12px;
          color: #666;
          white-space: nowrap;
        }
        .pie-chart-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .pie-chart {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
        }
        .pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .pie-total {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }
        .pie-label {
          font-size: 12px;
          color: #999;
        }
        .pie-legend {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .legend-label {
          flex: 1;
          color: #666;
        }
        .legend-value {
          color: #999;
          font-size: 12px;
        }
        .line-chart-container {
          position: relative;
          padding: 0 8px 24px;
        }
        .line-chart {
          width: 100%;
          height: calc(100% - 24px);
        }
        .line-chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          padding: 0 4px;
        }
        .line-label {
          font-size: 12px;
          color: #999;
        }
        .line-chart-legend {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 12px;
        }
        .line-chart-legend .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .legend-text {
          color: #666;
        }
        .timecoin-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timecoin-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          background: #fafafa;
        }
        .timecoin-stat.income {
          background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
        }
        .timecoin-stat.expenditure {
          background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
        }
        .timecoin-stat.total {
          background: linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%);
        }
        .timecoin-label {
          font-size: 14px;
          color: #666;
        }
        .timecoin-value {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }
        .dispute-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .dispute-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          border-radius: 8px;
          background: #fafafa;
        }
        .dispute-stat-value {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .dispute-stat-label {
          font-size: 13px;
          color: #666;
        }
        .loading,
        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .charts-row {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .pie-chart-container {
            flex-direction: column;
          }
          .dispute-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
