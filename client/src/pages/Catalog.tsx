import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getIdenticalProducts, addIdenticalProduct, getProductPriceHistory } from '../api/client';

interface Product {
  ID: number;
  ProductNameID: number;  
  ProductName: string;
  PricePerUnit: number;
  AmountOrWeight: number;
  TotalPurchases: number;
  CheckID: string;
  CreatedAt: string;
  CategoryName?: string;
}

function Catalog() {
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [sortBy, setSortBy] = useState('popularity');
  const [mainProduct, setMainProduct] = useState<Product | null>(null);
  const [linkingMode, setLinkingMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data),
  });

  // Fetch product details when selected
  const { data: productHistory } = useQuery({
    queryKey: ['productHistory', selectedProduct?.ProductNameID],
    queryFn: () => getProductPriceHistory(selectedProduct!.ProductNameID).then(r => r.data),
    enabled: !!selectedProduct,
  });

  const { data: identicalProducts } = useQuery({
    queryKey: ['identicalProducts', selectedProduct?.ProductNameID],
    queryFn: () => getIdenticalProducts(selectedProduct!.ProductNameID).then(r => r.data),
    enabled: !!selectedProduct,
  });

  const linkMutation = useMutation({
    mutationFn: ({ id, identicalId }: { id: number; identicalId: number }) =>
      addIdenticalProduct(id, identicalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setMainProduct(null);
      setLinkingMode(false);
    },
  });

  const allProducts: Product[] = Array.isArray(data) ? data : [];
  

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
        case 'price_asc': return a.PricePerUnit - b.PricePerUnit;
        case 'price_desc': return b.PricePerUnit - a.PricePerUnit;
        case 'name': return a.ProductName.localeCompare(b.ProductName);
        case 'popularity':
        default:
          return (b.TotalPurchases || 0) - (a.TotalPurchases || 0);
      }
    });

  const handleProductClick = (product: Product) => {
    if (linkingMode && mainProduct && product.ProductNameID !== mainProduct.ProductNameID) {
      linkMutation.mutate({ id: mainProduct.ProductNameID, identicalId: product.ProductNameID });
    } else if (!linkingMode) {
      setSelectedProduct(product);
    }
  };

  const startLinking = (product: Product) => {
    setMainProduct(product);
    setLinkingMode(true);
  };

  if (isLoading) {
    return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', textAlign: 'center' }}><div style={{ fontSize: '18px', color: '#64748b' }}>Загрузка...</div></div>;
  }

  if (error) {
    return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', textAlign: 'center' }}><div style={{ fontSize: '18px', color: '#ef4444' }}>Ошибка загрузки данных</div></div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      
      {linkingMode && mainProduct && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '12px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: '600' }}>Связывание:</span> выберите продукт, идентичный <strong>{mainProduct.ProductName}</strong>
          </div>
          <button onClick={() => { setMainProduct(null); setLinkingMode(false); }}
            style={{ padding: '6px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            Отмена
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
          onClick={() => setSelectedProduct(null)}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', maxWidth: '700px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>{selectedProduct.ProductName}</h2>
                <div style={{ color: '#64748b', fontSize: '14px' }}>
                  {selectedProduct.CategoryName || 'Без категории'} • Куплено {selectedProduct.TotalPurchases || 0} раз
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)}
                style={{ padding: '4px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            {/* Latest Price */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Последняя цена</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>
                {Array.isArray(productHistory) && productHistory.length > 0
                  ? `${productHistory[0].PricePerUnit?.toFixed(2)} ₽`
                  : `${selectedProduct.PricePerUnit?.toFixed(2)} ₽`}
              </div>
            </div>

            {/* Identical Products */}
            {identicalProducts && identicalProducts.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🔗 Идентичные продукты</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {identicalProducts.map((ip: any) => (
                    <span key={ip.IdenticalProductNameID} style={{
                      background: '#eef2ff', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', color: '#6366f1'
                    }}>{ip.IdenticalProductName || ip.identical_product_name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Price History */}
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>📊 История цен</div>
{productHistory ? (
  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
    {(() => {
      console.log('productHistory raw:', productHistory);
      const grouped = (Array.isArray(productHistory) ? productHistory : []).reduce((acc: Record<string, any[]>, entry: any) => {
        const key = entry.BrandName || 'Неизвестный магазин';
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      }, {});
      console.log('grouped:', grouped);
      return Object.entries(grouped).map(([brand, entries]) => (
        <div key={brand} style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>🏪 {brand}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Дата</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Цена</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Кол-во</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Адрес</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 8px' }}>
                    {entry.CreatedAt 
                      ? new Date(entry.CreatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                      : '-'}
                  </td>
                  <td style={{ padding: '6px 8px', fontWeight: '600' }}>{entry.PricePerUnit?.toFixed(2)} ₽</td>
                  <td style={{ padding: '6px 8px' }}>{entry.AmountOrWeight}</td>
                  <td style={{ padding: '6px 8px', color: '#64748b', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.ShopAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ));
    })()}
  </div>
) : (
  <div style={{ color: '#64748b', fontSize: '14px' }}>Загрузка...</div>
)}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>📦 Каталог</h1>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setViewMode('personal')} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: viewMode === 'personal' ? '#ffffff' : 'transparent', color: viewMode === 'personal' ? '#0f172a' : '#64748b', fontSize: '13px', fontWeight: viewMode === 'personal' ? '500' : '400', cursor: 'pointer', boxShadow: viewMode === 'personal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Личные</button>
          <button onClick={() => setViewMode('global')} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: viewMode === 'global' ? '#ffffff' : 'transparent', color: viewMode === 'global' ? '#0f172a' : '#64748b', fontSize: '13px', fontWeight: viewMode === 'global' ? '500' : '400', cursor: 'pointer', boxShadow: viewMode === 'global' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Все данные</button>
        </div>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>
        {viewMode === 'personal' ? 'Ваши продукты' : 'Все продукты из базы'} • {filteredProducts.length} уникальных
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Поиск продуктов..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#ffffff', cursor: 'pointer' }}>
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#ffffff', cursor: 'pointer' }}>
          <option value="popularity">По популярности</option>
          <option value="price_asc">Цена: по возрастанию</option>
          <option value="price_desc">Цена: по убыванию</option>
          <option value="name">По названию</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: '16px' }}>
          {search || category !== 'Все' ? 'Ничего не найдено. Попробуйте изменить фильтры.' : 'Нет данных. Загрузите первый чек!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {filteredProducts.map((product) => {
            const isSelected = mainProduct?.ID === product.ID;
            return (
              <div key={product.ID} onClick={() => handleProductClick(product)}
                style={{ 
                  background: isSelected ? '#eef2ff' : '#ffffff', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0', 
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                {!linkingMode && (
                  <button onClick={(e) => { e.stopPropagation(); startLinking(product); }}
                    style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#64748b' }}>
                    🔗
                  </button>
                )}
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', paddingRight: '30px' }}>
                  {product.ProductName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {product.CategoryName || 'Без категории'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                    {product.PricePerUnit?.toFixed(2)} ₽
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    🛒 {product.TotalPurchases || 0}
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