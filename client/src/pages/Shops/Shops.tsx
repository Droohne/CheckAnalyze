import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDefaultTemplates, getUserTemplates, getShops, getNearbyShops, compareShops, getTemplateWithProducts } from '../../api/client';
import './Shops.css';

function Shops() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'address' | 'nearby'>('address');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [brandFilter, setBrandFilter] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [shopBreakdown, setShopBreakdown] = useState<any[]>([]);

  const { data: userTemplates = [] } = useQuery({
    queryKey: ['userTemplates'],
    queryFn: () => getUserTemplates().then(r => r.data || []),
  });

  const { data: defaultTemplates = [] } = useQuery({
    queryKey: ['defaultTemplates'],
    queryFn: () => getDefaultTemplates().then(r => r.data || []),
  });

  const allTemplates = [...(userTemplates || []), ...(defaultTemplates || [])];

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => getShops().then(r => r.data || []),
  });

  const getProductsFromTemplate = async (template: any) => {
    const templateData = await getTemplateWithProducts(template.id);
    return (templateData.data || [])
      .filter((r: any) => r.ProductName)
      .map((r: any) => r.ProductName);
  };

  const groupShopRows = (rows: any[]) => {
    const shopMap: Record<number, any> = {};
    rows.forEach((row: any) => {
      if (!shopMap[row.ID]) {
        shopMap[row.ID] = {
          ID: row.ID, BrandName: row.BrandName, Address: row.Address,
          TotalPrice: 0, ProductCount: 0, Products: [],
        };
      }
      if (row.ProductName) {
        const hasData = row.PricePerUnit != null || row.ItemTotal != null;
        shopMap[row.ID].Products.push({
          ProductName: row.ProductName,
          PricePerUnit: row.PricePerUnit,
          AmountOrWeight: row.AmountOrWeight,
          ItemTotal: row.ItemTotal,
        });
        if (hasData) {
          shopMap[row.ID].TotalPrice += row.ItemTotal || 0;
          shopMap[row.ID].ProductCount++;
        }
      }
    });
    return Object.values(shopMap);
  };

  const handleGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      () => alert('Не удалось получить геолокацию')
    );
  };

  const handleAddressChange = (value: string) => {
    setAddressSearch(value);
    if (value.length > 1) {
      setAddressSuggestions(shops.filter((s: any) => s.Address?.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
      setShowSuggestions(true);
    } else setShowSuggestions(false);
  };

  const handleCompare = async () => {
    if (!selectedTemplate) return;
    const products = await getProductsFromTemplate(selectedTemplate);
    if (products.length === 0) { alert('Шаблон не содержит продуктов'); return; }
    const result = await compareShops(products);
    const shops = groupShopRows(result.data || []);
    const results = shops.map((s: any) => ({ ...s, hasAll: s.ProductCount >= products.length }));
    results.sort((a: any, b: any) => {
      if (b.ProductCount !== a.ProductCount) return b.ProductCount - a.ProductCount;
      return a.TotalPrice - b.TotalPrice;
    });
    setCompareResults(results.filter((s: any) => s.TotalPrice > 0));
    setShowResults(true);
  };

  const handleNearbyCompare = async () => {
    if (!selectedTemplate || !userLat || !userLng) return;
    const nearby = await getNearbyShops(userLat, userLng);
    const products = await getProductsFromTemplate(selectedTemplate);
    if (products.length === 0) { alert('Шаблон не содержит продуктов'); return; }
    const result = await compareShops(products);
    const shops = groupShopRows(result.data || []);
    const results = shops.map((s: any) => {
      const found = (nearby.data || []).find((n: any) => n.ID === s.ID);
      return { ...s, Distance: found?.Distance || null, hasAll: s.ProductCount >= products.length };
    });
    results.sort((a: any, b: any) => {
      if (b.ProductCount !== a.ProductCount) return b.ProductCount - a.ProductCount;
      return a.TotalPrice - b.TotalPrice;
    });
    setCompareResults(results.filter((s: any) => s.TotalPrice > 0));
    setShowResults(true);
  };

  const handleShopClick = (shop: any) => {
    setSelectedShop(shop);
    setShopBreakdown(shop.Products || []);
  };

  if (shops.length === 0 && userTemplates.length === 0) {
    return <div className="loading-state">Загрузка...</div>;
  }

  return (
    <div className="shops-container">
      <div className="page-header">
        <h1 className="page-title">🏪 Магазины</h1>
        <button 
          onClick={() => navigate('/templates')}
          className="btn btn-ghost"
        >
          📋 Управление шаблонами
        </button>
      </div>
      <p className="page-subtitle">
        Сравните цены на продукты в разных магазинах
      </p>

      <div className="shops-compare-section">
        <div className="shops-template-label">📋 Выберите шаблон для сравнения</div>
        <div className="shops-template-selector">
          {allTemplates.map((t: any) => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTemplate(t)}
              className={`shops-template-item ${selectedTemplate?.id === t.id ? 'shops-template-selected' : ''}`}
            >
              {t.name}
              <span className="shops-template-count">({t.products?.length || 0})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="shops-mode-selector">
        <button 
          onClick={() => setMode('address')}
          className={`shops-mode-btn ${mode === 'address' ? 'shops-mode-btn-active' : 'shops-mode-btn-inactive'}`}
        >
          🔍 По адресу
        </button>
        <button 
          onClick={() => { setMode('nearby'); handleGeolocation(); }}
          className={`shops-mode-btn ${mode === 'nearby' ? 'shops-mode-btn-active' : 'shops-mode-btn-inactive'}`}
        >
          📍 Рядом со мной
        </button>
      </div>

      <div className="shops-compare-section">
        {mode === 'address' ? (
          <div className="shops-search-grid">
            <div>
              <div className="shops-field-label">Бренд</div>
              <select 
                value={brandFilter} 
                onChange={(e) => setBrandFilter(e.target.value)}
                className="select"
              >
                <option value="">Все бренды</option>
                {[...new Set(shops.map((s: any) => s.BrandName))].map((b: any) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="shops-address-input">
              <div className="shops-field-label">Адрес</div>
              <input 
                type="text" 
                placeholder="Введите улицу или адрес..." 
                value={addressSearch}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => addressSearch.length > 1 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="input"
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="shops-suggestions">
                  {addressSuggestions.map((s: any) => (
                    <div 
                      key={s.ID} 
                      onClick={() => { setAddressSearch(s.Address); setBrandFilter(s.BrandName); setShowSuggestions(false); }}
                      className="shops-suggestion-item"
                    >
                      <div className="shops-suggestion-brand">{s.BrandName}</div>
                      <div className="shops-suggestion-address">{s.Address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={handleCompare} 
              disabled={!selectedTemplate}
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              Сравнить
            </button>
          </div>
        ) : (
          <div className="shops-nearby-grid">
            <div>
              <div className="shops-field-label">Широта</div>
              <input 
                type="text" 
                value={userLat || ''} 
                readOnly 
                className="input"
                style={{ background: 'var(--color-bg-hover)' }}
              />
            </div>
            <div>
              <div className="shops-field-label">Долгота</div>
              <input 
                type="text" 
                value={userLng || ''} 
                readOnly 
                className="input"
                style={{ background: 'var(--color-bg-hover)' }}
              />
            </div>
            <button 
              onClick={handleNearbyCompare} 
              disabled={!selectedTemplate || !userLat}
              className="btn btn-primary"
            >
              Сравнить
            </button>
          </div>
        )}
      </div>

      {showResults && (
        <div className="shops-results">
          <div className="shops-results-title">🛒 Результаты сравнения • {selectedTemplate?.name}</div>
          {compareResults.length === 0 ? (
            <div className="empty-state">Нет данных для сравнения</div>
          ) : (
            <div className="grid-auto">
              {compareResults.map((shop: any, i: number) => (
                <div 
                  key={shop.ID || i} 
                  onClick={() => handleShopClick(shop)}
                  className={`shops-result-card ${shop.hasAll ? 'shops-result-card-full' : 'shops-result-card-partial'}`}
                >
                  {!shop.hasAll && (
                    <div className="shops-result-badge shops-result-badge-partial">
                      ⚠️ Найдено {shop.ProductCount} поз.
                    </div>
                  )}
                  {shop.hasAll && (
                    <div className="shops-result-badge shops-result-badge-full">
                      ✅ Все продукты в наличии
                    </div>
                  )}
                  <div className="shops-result-name">{shop.BrandName}</div>
                  <div className="shops-result-address">{shop.Address}</div>
                  <div className="shops-result-footer">
                    <span className="shops-result-total">{Number(shop.TotalPrice).toFixed(2)} ₽</span>
                    <span className="shops-result-count">📦 {shop.ProductCount} поз.</span>
                  </div>
                  {shop.Distance != null && (
                    <div className="shops-result-distance">📍 {Number(shop.Distance).toFixed(1)} км</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedShop && (
        <div className="modal-overlay" onClick={() => setSelectedShop(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="shops-detail-header">
              <h3 style={{ margin: 0 }}>{selectedShop.BrandName}</h3>
              <button 
                onClick={() => setSelectedShop(null)} 
                className="btn btn-ghost"
                style={{ fontSize: 'var(--font-size-xl)' }}
              >
                ✕
              </button>
            </div>
            <div className="shops-detail-address">{selectedShop.Address}</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Продукт</th>
                  <th>Цена</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {shopBreakdown.map((p: any, i: number) => (
                  <tr 
                    key={i} 
                    className={!p.PricePerUnit ? 'shops-detail-product-missing' : ''}
                  >
                    <td>
                      {p.ProductName}
                      {!p.PricePerUnit && (
                        <span className="shops-detail-missing-badge">Нет данных</span>
                      )}
                    </td>
                    <td>{p.PricePerUnit ? `${Number(p.PricePerUnit).toFixed(2)} ₽` : '—'}</td>
                    <td>{p.AmountOrWeight ?? '—'}</td>
                    <td style={{ fontWeight: '600' }}>
                      {p.ItemTotal ? `${Number(p.ItemTotal).toFixed(2)} ₽` : '—'}
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