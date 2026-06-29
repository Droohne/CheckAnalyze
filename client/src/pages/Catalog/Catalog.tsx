import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getIdenticalProducts, addIdenticalProduct, getProductPriceHistory } from '../../api/client';
import './Catalog.css';

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
    return (
      <div className="loading-state">
        <div className="loading-text">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-text">Ошибка загрузки данных</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Linking Mode Banner */}
      {linkingMode && mainProduct && (
        <div className="linking-banner">
          <div>
            <span className="linking-banner-text">Связывание:</span> выберите продукт, идентичный <strong>{mainProduct.ProductName}</strong>
          </div>
          <button 
            onClick={() => { setMainProduct(null); setLinkingMode(false); }}
            className="linking-banner-cancel"
          >
            Отмена
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div>
                <h2 className="page-title" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-xs)' }}>
                  {selectedProduct.ProductName}
                </h2>
                <div className="page-subtitle" style={{ marginBottom: 0 }}>
                  {selectedProduct.CategoryName || 'Без категории'} • Куплено {selectedProduct.TotalPurchases || 0} раз
                </div>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="btn btn-ghost"
                style={{ fontSize: 'var(--font-size-xl)' }}
              >
                ✕
              </button>
            </div>

            {/* Latest Price */}
            <div className="product-modal-price">
              <div className="product-modal-price-label">Последняя цена</div>
              <div className="product-modal-price-value">
                {Array.isArray(productHistory) && productHistory.length > 0
                  ? `${productHistory[0].PricePerUnit?.toFixed(2)} ₽`
                  : `${selectedProduct.PricePerUnit?.toFixed(2)} ₽`}
              </div>
            </div>

            {/* Identical Products */}
            {identicalProducts && identicalProducts.length > 0 && (
              <div className="identical-products">
                <div className="identical-products-title">🔗 Идентичные продукты</div>
                <div className="flex flex-wrap gap-sm">
                  {identicalProducts.map((ip: any) => (
                    <span 
                      key={ip.IdenticalProductNameID} 
                      className="identical-tag"
                    >
                      {ip.IdenticalProductName || ip.identical_product_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price History */}
            <div>
              <div className="price-history-title">📊 История цен</div>
              {productHistory ? (
                <div className="price-history-container">
                  {(() => {
                    const grouped = (Array.isArray(productHistory) ? productHistory : []).reduce((acc: Record<string, any[]>, entry: any) => {
                      const key = entry.BrandName || 'Неизвестный магазин';
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(entry);
                      return acc;
                    }, {});
                    
                    return Object.entries(grouped).map(([brand, entries]) => (
                      <div key={brand} className="price-history-brand-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div className="price-history-brand">🏪 {brand}</div>
                        <table className="price-history-table">
                          <thead>
                            <tr>
                              <th>Дата</th>
                              <th>Цена</th>
                              <th>Кол-во</th>
                              <th>Адрес</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entries.map((entry: any, i: number) => (
                              <tr key={i}>
                                <td>
                                  {entry.CreatedAt 
                                    ? new Date(entry.CreatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                                    : '-'}
                                </td>
                                <td className="price-value">{entry.PricePerUnit?.toFixed(2)} ₽</td>
                                <td>{entry.AmountOrWeight}</td>
                                <td className="address">{entry.ShopAddress || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="loading-text" style={{ fontSize: 'var(--font-size-base)' }}>Загрузка...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">📦 Каталог</h1>
        <div className="view-toggle">
          <button 
            onClick={() => setViewMode('personal')} 
            className={`view-toggle-btn ${
              viewMode === 'personal' ? 'view-toggle-btn-active' : 'view-toggle-btn-inactive'
            }`}
          >
            Личные
          </button>
          <button 
            onClick={() => setViewMode('global')} 
            className={`view-toggle-btn ${
              viewMode === 'global' ? 'view-toggle-btn-active' : 'view-toggle-btn-inactive'
            }`}
          >
            Все данные
          </button>
        </div>
      </div>
      <p className="page-subtitle">
        {viewMode === 'personal' ? 'Ваши продукты' : 'Все продукты из базы'} • {filteredProducts.length} уникальных
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <input 
          type="text" 
          placeholder="Поиск продуктов..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="select"
        >
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="select"
        >
          <option value="popularity">По популярности</option>
          <option value="price_asc">Цена: по возрастанию</option>
          <option value="price_desc">Цена: по убыванию</option>
          <option value="name">По названию</option>
        </select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          {search || category !== 'Все' ? 'Ничего не найдено. Попробуйте изменить фильтры.' : 'Нет данных. Загрузите первый чек!'}
        </div>
      ) : (
        <div className="grid-4">
          {filteredProducts.map((product) => {
            const isSelected = mainProduct?.ID === product.ID;
            return (
              <div 
                key={product.ID} 
                onClick={() => handleProductClick(product)}
                className={`product-card ${isSelected ? 'product-card-selected' : ''}`}
              >
                {!linkingMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); startLinking(product); }}
                    className="product-card-link-btn"
                  >
                    🔗
                  </button>
                )}
                <div className="product-card-name">
                  {product.ProductName}
                </div>
                <div className="product-card-category">
                  {product.CategoryName || 'Без категории'}
                </div>
                <div className="product-card-footer">
                  <span className="product-card-price">
                    {product.PricePerUnit?.toFixed(2)} ₽
                  </span>
                  <span className="product-card-purchases">
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