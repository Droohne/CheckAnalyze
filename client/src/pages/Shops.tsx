import { useState } from 'react';

function Shops() {
  const [activeTab, setActiveTab] = useState<'search' | 'rating'>('search');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    { id: 1, name: 'Еженедельный', products: 12 },
    { id: 2, name: 'Праздничный', products: 8 },
    { id: 3, name: 'Без шаблона', products: 0 },
  ];

  const stores = [
    { name: 'Магнит', total: 1245.50, rating: 4.5, savings: 0 },
    { name: 'Пятерочка', total: 1320.30, rating: 4.2, savings: -74.80 },
    { name: 'Перекресток', total: 1410.20, rating: 4.0, savings: -164.70 },
    { name: 'Ашан', total: 1180.90, rating: 4.3, savings: 64.60 },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 6px 0' }}>🏪 Shops</h1>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>Find stores and compare prices</p>

      <div style={{ display: 'flex', gap: '0', marginBottom: '32px', borderBottom: '1px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            fontSize: '15px',
            fontWeight: activeTab === 'search' ? '600' : '400',
            color: activeTab === 'search' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'search' ? '2px solid #0f172a' : 'none',
            cursor: 'pointer',
          }}
        >
          🔍 Поиск магазинов
        </button>
        <button
          onClick={() => setActiveTab('rating')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            fontSize: '15px',
            fontWeight: activeTab === 'rating' ? '600' : '400',
            color: activeTab === 'rating' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'rating' ? '2px solid #0f172a' : 'none',
            cursor: 'pointer',
          }}
        >
          🏆 Рейтинг магазинов
        </button>
      </div>

      {activeTab === 'search' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Поиск по адресу</div>
              <input 
                type="text" 
                placeholder="Введите адрес магазина..." 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <button style={{ marginTop: '12px', padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Найти
              </button>
            </div>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Ближайшие магазины</div>
              <button style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                📍 Использовать геолокацию
              </button>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '14px' }}>Магнит (0.5 км)</div>
                <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '14px' }}>Пятерочка (0.8 км)</div>
                <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '14px' }}>Перекресток (1.2 км)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rating' && (
        <div>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Шаблон для сравнения</div>
                <select 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                >
                  <option value="">Выберите шаблон...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.products} продуктов)</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  disabled={!selectedTemplate}
                  style={{ 
                    padding: '10px 32px', 
                    background: selectedTemplate ? '#0f172a' : '#94a3b8', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                    width: '100%',
                  }}
                >
                  Сравнить
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Результаты сравнения</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 0', textAlign: 'left', color: '#64748b', fontWeight: '500' }}>Магазин</th>
                  <th style={{ padding: '10px 0', textAlign: 'right', color: '#64748b', fontWeight: '500' }}>Итого</th>
                  <th style={{ padding: '10px 0', textAlign: 'right', color: '#64748b', fontWeight: '500' }}>Рейтинг</th>
                  <th style={{ padding: '10px 0', textAlign: 'right', color: '#64748b', fontWeight: '500' }}>Экономия</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 0', fontWeight: i === 0 ? '600' : '400', color: i === 0 ? '#16a34a' : '#0f172a' }}>
                      {i === 0 && '🏆 '} {store.name}
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>${store.total}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>⭐ {store.rating}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: store.savings >= 0 ? '#10b981' : '#ef4444' }}>
                      {store.savings >= 0 ? '+' : ''}{store.savings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shops;