import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDefaultTemplates, getUserTemplates, getShops, getNearbyShops, compareShops, getTemplateWithProducts } from '../api/client';

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

  if (shops.length === 0 && userTemplates.length === 0) return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>🏪 Магазины</h1>
        <button onClick={() => navigate('/templates')}
          style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#0f172a' }}>
          📋 Управление шаблонами
        </button>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>
        Сравните цены на продукты в разных магазинах
      </p>

      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>📋 Выберите шаблон для сравнения</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {allTemplates.map((t: any) => (
            <div key={t.id} onClick={() => setSelectedTemplate(t)}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: selectedTemplate?.id === t.id ? '2px solid #6366f1' : '1px solid #e2e8f0',
                background: selectedTemplate?.id === t.id ? '#eef2ff' : '#ffffff',
                cursor: 'pointer', fontSize: '14px',
                fontWeight: selectedTemplate?.id === t.id ? '600' : '400',
                transition: 'all 0.2s',
              }}>
              {t.name}
              <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '12px' }}>({t.products?.length || 0})</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setMode('address')}
          style={{ padding: '10px 24px', borderRadius: '8px', border: mode === 'address' ? '2px solid #0f172a' : '1px solid #e2e8f0', background: mode === 'address' ? '#0f172a' : '#ffffff', color: mode === 'address' ? '#fff' : '#0f172a', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          🔍 По адресу</button>
        <button onClick={() => { setMode('nearby'); handleGeolocation(); }}
          style={{ padding: '10px 24px', borderRadius: '8px', border: mode === 'nearby' ? '2px solid #0f172a' : '1px solid #e2e8f0', background: mode === 'nearby' ? '#0f172a' : '#ffffff', color: mode === 'nearby' ? '#fff' : '#0f172a', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          📍 Рядом со мной</button>
      </div>

      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        {mode === 'address' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Бренд</div>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                <option value="">Все бренды</option>
                {[...new Set(shops.map((s: any) => s.BrandName))].map((b: any) => (<option key={b} value={b}>{b}</option>))}
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Адрес</div>
              <input type="text" placeholder="Введите улицу или адрес..." value={addressSearch}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => addressSearch.length > 1 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {addressSuggestions.map((s: any) => (
                    <div key={s.ID} onClick={() => { setAddressSearch(s.Address); setBrandFilter(s.BrandName); setShowSuggestions(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}>
                      <div style={{ fontWeight: '500' }}>{s.BrandName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{s.Address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleCompare} disabled={!selectedTemplate}
              style={{ padding: '10px 24px', background: selectedTemplate ? '#0f172a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: selectedTemplate ? 'pointer' : 'not-allowed', marginTop: '20px' }}>
              Сравнить</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div><div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Широта</div><input type="text" value={userLat || ''} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }} /></div>
            <div><div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Долгота</div><input type="text" value={userLng || ''} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }} /></div>
            <button onClick={handleNearbyCompare} disabled={!selectedTemplate || !userLat}
              style={{ padding: '10px 24px', background: selectedTemplate && userLat ? '#0f172a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: selectedTemplate && userLat ? 'pointer' : 'not-allowed' }}>
              Сравнить</button>
          </div>
        )}
      </div>

      {showResults && (
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🛒 Результаты сравнения • {selectedTemplate?.name}</div>
          {compareResults.length === 0 ? (
            <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>Нет данных для сравнения</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {compareResults.map((shop: any, i: number) => (
                <div key={shop.ID || i} onClick={() => handleShopClick(shop)}
                  style={{ background: shop.hasAll ? '#f0fdf4' : '#ffffff', padding: '20px', borderRadius: '12px', border: shop.hasAll ? '2px solid #10b981' : '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s', position: 'relative' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                  {!shop.hasAll && <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '8px' }}>⚠️ Найдено {shop.ProductCount} поз.</div>}
                  {shop.hasAll && <div style={{ fontSize: '11px', color: '#10b981', marginBottom: '8px' }}>✅ Все продукты в наличии</div>}
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{shop.BrandName}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{shop.Address}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{Number(shop.TotalPrice).toFixed(2)} ₽</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>📦 {shop.ProductCount} поз.</span>
                  </div>
                  {shop.Distance != null && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>📍 {Number(shop.Distance).toFixed(1)} км</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedShop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
          onClick={() => setSelectedShop(null)}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '550px', width: '100%', maxHeight: '70vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>{selectedShop.BrandName}</h3>
              <button onClick={() => setSelectedShop(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{selectedShop.Address}</div>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><th style={{ padding: '6px' }}>Продукт</th><th style={{ padding: '6px' }}>Цена</th><th style={{ padding: '6px' }}>Кол-во</th><th style={{ padding: '6px' }}>Сумма</th></tr></thead>
              <tbody>
                {shopBreakdown.map((p: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', opacity: p.PricePerUnit ? 1 : 0.4, background: p.PricePerUnit ? 'transparent' : '#fef2f2' }}>
                    <td style={{ padding: '6px' }}>{p.ProductName}{!p.PricePerUnit && <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '4px' }}>Нет данных</span>}</td>
                    <td style={{ padding: '6px' }}>{p.PricePerUnit ? `${Number(p.PricePerUnit).toFixed(2)} ₽` : '—'}</td>
                    <td style={{ padding: '6px' }}>{p.AmountOrWeight ?? '—'}</td>
                    <td style={{ padding: '6px', fontWeight: '600' }}>{p.ItemTotal ? `${Number(p.ItemTotal).toFixed(2)} ₽` : '—'}</td>
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