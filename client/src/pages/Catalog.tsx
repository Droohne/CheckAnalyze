import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/client';

interface Product {
  ID: number;
  ProductName: string;
  PricePerUnit: number;
  AmountOrWeight: number;
  CheckID: string;
  CreatedAt: string;
  CategoryName?: string;
}

function Catalog() {
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [sortBy, setSortBy] = useState('popularity');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data),
  });

  const allProducts: Product[] = Array.isArray(data) ? data : [];

  // Deduplicate by ProductName, keep latest entry (highest ID or most recent)
  const products = Object.values(
    allProducts.reduce((acc: Record<string, Product>, product) => {
      const existing = acc[product.ProductName];
      if (!existing || product.ID > existing.ID) {
        acc[product.ProductName] = product;
      }
      return acc;
    }, {})
  );

  const categories: string[] = ['Все', ...new Set(products.map((p) => p.CategoryName || 'Без категории'))];

  const filteredProducts = products
    .filter((p) => {
      if (!p.ProductName) return false;
      const matchesSearch = p.ProductName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'Все' || p.CategoryName === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.PricePerUnit - b.PricePerUnit;
        case 'price_desc':
          return b.PricePerUnit - a.PricePerUnit;
        case 'name':
          return a.ProductName.localeCompare(b.ProductName);
        case 'popularity':
        default:
          const countA = allProducts.filter(p => p.ProductName === a.ProductName).length;
          const countB = allProducts.filter(p => p.ProductName === b.ProductName).length;
          return countB - countA;
      }
    });

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#ef4444' }}>Ошибка загрузки данных</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>📦 Каталог</h1>
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
        {viewMode === 'personal' ? 'Ваши продукты' : 'Все продукты из базы'} • {filteredProducts.length} уникальных
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Поиск продуктов..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            flex: 1, 
            minWidth: '200px', 
            padding: '10px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ 
            padding: '10px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            fontSize: '14px', 
            background: '#ffffff',
            cursor: 'pointer',
          }}
        >
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ 
            padding: '10px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            fontSize: '14px', 
            background: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <option value="popularity">По популярности</option>
          <option value="price_asc">Цена: по возрастанию</option>
          <option value="price_desc">Цена: по убыванию</option>
          <option value="name">По названию</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#64748b',
          fontSize: '16px',
        }}>
          {search || category !== 'Все' 
            ? 'Ничего не найдено. Попробуйте изменить фильтры.' 
            : 'Нет данных. Загрузите первый чек!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {filteredProducts.map((product) => {
            const purchaseCount = allProducts.filter(p => p.ProductName === product.ProductName).length;
            return (
              <div 
                key={product.ID} 
                style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                  {product.ProductName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {product.CategoryName || 'Без категории'}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '12px' 
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                    {product.PricePerUnit?.toFixed(2)} ₽
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    🛒 {purchaseCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Catalog;