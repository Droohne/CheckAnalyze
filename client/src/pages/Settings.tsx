import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { getStats, getProducts, getCategories } from '../api/client';

const COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

function Settings() {
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('global');

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => getStats().then(r => r.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => getProducts().then(r => r.data) });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data) });

  const s = stats || { totalChecks: 0, totalUniqueProducts: 0, totalProductEntries: 0 };
  const p = products || [];
  const cat = categories || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>⚙️ Settings</h1>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('personal')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'personal' ? '#ffffff' : 'transparent',
              color: viewMode === 'personal' ? '#0f172a' : '#64748b',
              fontSize: '13px',
              fontWeight: viewMode === 'personal' ? '500' : '400',
              cursor: 'pointer',
              boxShadow: viewMode === 'personal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Личные
          </button>
          <button
            onClick={() => setViewMode('global')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'global' ? '#ffffff' : 'transparent',
              color: viewMode === 'global' ? '#0f172a' : '#64748b',
              fontSize: '13px',
              fontWeight: viewMode === 'global' ? '500' : '400',
              cursor: 'pointer',
              boxShadow: viewMode === 'global' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Все данные
          </button>
        </div>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>
        {viewMode === 'personal' ? 'Ваша статистика' : 'Общая статистика'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Checks</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.totalChecks}</div>
          <div style={{ fontSize: '13px', color: '#10b981', marginTop: '4px' }}>↑ 12.3%</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Unique Products</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.totalUniqueProducts}</div>
          <div style={{ fontSize: '13px', color: '#10b981', marginTop: '4px' }}>↑ 8.1%</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Entries</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{s.totalProductEntries}</div>
          <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>↓ 2.7%</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Avg. Price</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>$134.50</div>
          <div style={{ fontSize: '13px', color: '#10b981', marginTop: '4px' }}>↑ 3.2%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Top Products</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={p.slice(0, 8)} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Bar dataKey="usage_count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '350px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Categories</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={cat} dataKey="product_count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {cat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default Settings;