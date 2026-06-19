import { useState } from 'react';

function Catalog() {
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');

  const products = [
    { id: 1, name: 'Хлеб белый', category: 'Бакалея', popularity: 89, price: 89.99 },
    { id: 2, name: 'Молоко 3.2%', category: 'Молочные', popularity: 67, price: 79.50 },
    { id: 3, name: 'Яйца куриные', category: 'Молочные', popularity: 54, price: 129.00 },
    { id: 4, name: 'Сахар песок', category: 'Бакалея', popularity: 48, price: 59.90 },
    { id: 5, name: 'Масло подсолнечное', category: 'Бакалея', popularity: 41, price: 149.00 },
    { id: 6, name: 'Гречка', category: 'Бакалея', popularity: 29, price: 89.99 },
    { id: 7, name: 'Курица', category: 'Мясо', popularity: 76, price: 249.00 },
    { id: 8, name: 'Сыр твердый', category: 'Молочные', popularity: 35, price: 189.00 },
  ];

  const categories = ['Все', 'Бакалея', 'Молочные', 'Мясо', 'Овощи', 'Фрукты'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>📦 Catalog</h1>
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
        {viewMode === 'personal' ? 'Ваши продукты' : 'Все продукты из базы'}
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Поиск продуктов..." 
          style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
        />
        <select style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#ffffff' }}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#ffffff' }}>
          <option>По популярности</option>
          <option>Цена: по возрастанию</option>
          <option>Цена: по убыванию</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {products.map(product => (
          <div key={product.id} style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{product.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{product.category}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{product.price} ₽</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>🔥 {product.popularity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalog;