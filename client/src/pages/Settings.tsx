import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { getStats, getProducts, getCategories } from '../api/client';

const PIE_COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#e2e8f0'];

function Settings() {
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('global');

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => getStats().then(r => r.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => getProducts().then(r => r.data) });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data) });

  const s = stats || { TotalChecks: 0, TotalUniqueProducts: 0, TotalProductEntries: 0, AvgPrice: 0 };
  const p = Array.isArray(products) ? products : [];

  const cat = Array.isArray(categories) ? categories.map((c: any) => {
    const count = p.filter((item: any) => item.CategoryName === c.Name).length;
    return { name: c.Name, product_count: count };
  }).filter((c: any) => c.product_count > 0)
    .sort((a: any, b: any) => b.product_count - a.product_count) : [];

  const top7 = cat.slice(0, 7);
  const otherCount = cat.slice(7).reduce((sum: number, c: any) => sum + c.product_count, 0);
  const otherItems = cat.slice(7);

  const pieData = otherCount > 0 
    ? [...top7, { name: 'Другое', product_count: otherCount, items: otherItems }]
    : top7;

  const totalCount = pieData.reduce((sum: number, d: any) => sum + d.product_count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.product_count / totalCount) * 100).toFixed(0);
      if (data.name === 'Другое' && data.items) {
        return (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Другое ({percent}%)</div>
            {data.items.map((item: any) => {
              const itemPercent = ((item.product_count / totalCount) * 100).toFixed(0);
              return (
                <div key={item.name} style={{ fontSize: 12, color: '#64748b' }}>
                  {item.name}: {itemPercent}%
                </div>
              );
            })}
          </div>
        );
      }
      return (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
          {data.name}: {percent}%
        </div>
      );
    }
    return null;
  };

  const productCounts: Record<string, number> = {};
  p.forEach((item: any) => {
    const name = item.ProductName || item.product_name || '';
    if (name) productCounts[name] = (productCounts[name] || 0) + 1;
  });
  const topProducts = Object.entries(productCounts)
    .map(([name, count]) => ({ name, usage_count: count }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 8);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>⚙️ Статистика</h1>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('personal')}
            style={{
              padding: '6px 16px', border: 'none', borderRadius: '6px',
              background: viewMode === 'personal' ? '#ffffff' : 'transparent',
              color: viewMode === 'personal' ? '#0f172a' : '#64748b',
              fontSize: '13px', fontWeight: viewMode === 'personal' ? '500' : '400',
              cursor: 'pointer', boxShadow: viewMode === 'personal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >Личные</button>
          <button
            onClick={() => setViewMode('global')}
            style={{
              padding: '6px 16px', border: 'none', borderRadius: '6px',
              background: viewMode === 'global' ? '#ffffff' : 'transparent',
              color: viewMode === 'global' ? '#0f172a' : '#64748b',
              fontSize: '13px', fontWeight: viewMode === 'global' ? '500' : '400',
              cursor: 'pointer', boxShadow: viewMode === 'global' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >Все данные</button>
        </div>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>
        {viewMode === 'personal' ? 'Ваша статистика' : 'Общая статистика'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Всего чеков</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.TotalChecks || 0}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Уникальных продуктов</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.TotalUniqueProducts || 0}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Всего записей</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.TotalProductEntries || 0}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Средняя цена</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.AvgPrice ? s.AvgPrice.toFixed(2) + ' ₽' : '0 ₽'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '350px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Топ продуктов</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Bar dataKey="usage_count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '350px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Категории</div>
          <ResponsiveContainer width="100%" height={280}>
<PieChart>
  <Pie 
    data={pieData} 
    dataKey="product_count" 
    nameKey="name" 
    cx="50%" 
    cy="50%" 
    outerRadius={80} 
    startAngle={90} 
    endAngle={-270} 
    stroke="none" 
    label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
      const RADIAN = Math.PI / 180;
      const radius = (outerRadius ?? 0) + 5;
      const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
      const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
      const index = pieData.findIndex((d: any) => d.name === name);
      return (
        <text x={x} y={y} fill={PIE_COLORS[index % PIE_COLORS.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14}>
          {name} {((percent ?? 0) * 100).toFixed(0)}%
        </text>
      );
    }}
    labelLine={false}
  >
    {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
  </Pie>
  <Tooltip content={<CustomTooltip />} />
</PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default Settings;