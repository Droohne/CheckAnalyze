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
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [compareResults, setCompareResults] = useState<any[]>([]);

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

  const handleGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => alert('Не удалось получить геолокацию')
    );
  };

  const handleCompare = async () => {
    if (!selectedTemplate) return;

    // Get template products
    const templateData = await getTemplateWithProducts(selectedTemplate.id);
    const products = (templateData.data || [])
      .filter((r: any) => r.product_name)
      .map((r: any) => r.product_name);

    if (products.length === 0) {
      alert('Шаблон не содержит продуктов');
      return;
    }

    const result = await compareShops(products);
    setCompareResults(result.data || []);
    setShowResults(true);
  };

  const handleNearbyCompare = async () => {
    if (!selectedTemplate || !userLat || !userLng) return;

    const nearby = await getNearbyShops(userLat, userLng);
    const nearbyData = nearby.data || [];

    const templateData = await getTemplateWithProducts(selectedTemplate.id);
    const products = (templateData.data || [])
      .filter((r: any) => r.product_name)
      .map((r: any) => r.product_name);

    if (products.length === 0) {
      alert('Шаблон не содержит продуктов');
      return;
    }

    const result = await compareShops(products);
    const withDistance = (result.data || []).map((shop: any) => {
      const found = nearbyData.find((n: any) => n.ID === shop.ID);
      return { ...shop, Distance: found?.Distance || null };
    });
    setCompareResults(withDistance);
    setShowResults(true);
  };

  const filteredShops = addressSearch
    ? shops.filter((s: any) => s.Address?.toLowerCase().includes(addressSearch.toLowerCase()))
    : shops;

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

      {/* Template Selection */}
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
              <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '12px' }}>
                ({t.products?.length || 0})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mode Selection */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setMode('address')}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: mode === 'address' ? '2px solid #0f172a' : '1px solid #e2e8f0',
            background: mode === 'address' ? '#0f172a' : '#ffffff', color: mode === 'address' ? '#fff' : '#0f172a',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          }}>🔍 По адресу</button>
        <button onClick={() => { setMode('nearby'); handleGeolocation(); }}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: mode === 'nearby' ? '2px solid #0f172a' : '1px solid #e2e8f0',
            background: mode === 'nearby' ? '#0f172a' : '#ffffff', color: mode === 'nearby' ? '#fff' : '#0f172a',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          }}>📍 Рядом со мной</button>
      </div>

      {/* Search Area */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        {mode === 'address' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Бренд</div>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                <option value="">Все бренды</option>
                {[...new Set(shops.map((s: any) => s.BrandName))].map((b: any) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Адрес</div>
              <input type="text" placeholder="Введите улицу или адрес..." value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
            </div>
            <button onClick={handleCompare} disabled={!selectedTemplate}
              style={{ padding: '10px 24px', background: selectedTemplate ? '#0f172a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: selectedTemplate ? 'pointer' : 'not-allowed' }}>
              Сравнить
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Широта</div>
              <input type="text" value={userLat || ''} readOnly
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Долгота</div>
              <input type="text" value={userLng || ''} readOnly
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }} />
            </div>
            <button onClick={handleNearbyCompare} disabled={!selectedTemplate || !userLat}
              style={{ padding: '10px 24px', background: selectedTemplate && userLat ? '#0f172a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: selectedTemplate && userLat ? 'pointer' : 'not-allowed' }}>
              Сравнить
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            🛒 Результаты сравнения • {selectedTemplate?.name}
          </div>
          {compareResults.length === 0 ? (
            <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>Нет данных для сравнения</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {compareResults.map((shop: any, i: number) => (
                <div key={shop.ID || i}
                  style={{
                    background: i === 0 ? '#f0fdf4' : '#ffffff',
                    padding: '20px', borderRadius: '12px',
                    border: i === 0 ? '2px solid #10b981' : '1px solid #e2e8f0',
                    cursor: 'pointer', transition: 'box-shadow 0.2s', position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: '-10px', right: '12px', background: '#10b981', color: '#fff', padding: '2px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                      🏆 Лучшая цена
                    </div>
                  )}
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{shop.BrandName}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{shop.Address}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{Number(shop.TotalPrice).toFixed(2)} ₽</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>📦 {shop.ProductCount} поз.</span>
                  </div>
                  {shop.Distance != null && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      📍 {Number(shop.Distance).toFixed(1)} км
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Shops;