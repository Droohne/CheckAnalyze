import { useState } from 'react';

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const liveFeed = [
    { product: 'Хлеб белый', store: 'Магнит', price: '89.99 ₽' },
    { product: 'Молоко 3.2%', store: 'Пятерочка', price: '79.50 ₽' },
    { product: 'Яйца куриные', store: 'Перекресток', price: '129.00 ₽' },
    { product: 'Сахар песок', store: 'Ашан', price: '59.90 ₽' },
    { product: 'Масло подсолнечное', store: 'Лента', price: '149.00 ₽' },
    { product: 'Гречка', store: 'Магнит', price: '89.99 ₽' },
    { product: 'Курица', store: 'Пятерочка', price: '249.00 ₽' },
    { product: 'Сыр', store: 'Перекресток', price: '189.00 ₽' },
    { product: 'Рис', store: 'Ашан', price: '75.00 ₽' },
    { product: 'Мука', store: 'Магнит', price: '55.00 ₽' },
  ];

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setTimeout(() => setUploaded(false), 3000);
    }, 1500);
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '20px 40px',
    }}>
      
      {/* Upload Section */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: '0 0 auto',
      }}>
        <div style={{ 
          background: '#ffffff', 
          padding: '28px 40px', 
          borderRadius: '16px', 
          border: '2px dashed #e2e8f0',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>Вставьте чек</h2>
          <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '14px' }}>
            Загрузите JSON файл из приложения СканЧек
          </p>
          
          <div style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '12px',
            marginBottom: '12px',
            background: '#f8fafc',
          }}>
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ width: '100%', fontSize: '14px' }}
            />
            {file && (
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#0f172a' }}>
                📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{ 
              padding: '10px 40px', 
              background: !file || uploading ? '#94a3b8' : '#0f172a', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '15px',
              fontWeight: '500',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? '⏳ Загрузка...' : uploaded ? '✅ Загружено!' : 'Загрузить чек'}
          </button>
        </div>
      </div>

      {/* Infinite Scrolling Ticker */}
      <div style={{ 
        marginTop: '16px',
        padding: '10px 0',
        borderTop: '1px solid #e2e8f0',
        overflow: 'hidden',
        background: '#f8fafc',
        borderRadius: '10px',
        flex: '0 0 auto',
      }}>
        <div style={{ 
          display: 'flex',
          animation: 'scroll 30s linear infinite',
          gap: '20px',
          whiteSpace: 'nowrap',
        }}>
          {[...liveFeed, ...liveFeed].map((item, i) => (
<div
  key={i}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '6px 14px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    flexShrink: 0,
    maxWidth: '200px',
    minWidth: '120px',
  }}
>
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-start',
    overflow: 'hidden',
    minWidth: 0,
    flex: 1,
  }}>
    <span style={{ 
      fontWeight: '600', 
      fontSize: '13px', 
      color: '#0f172a',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '120px',
    }}>
      {item.product}
    </span>
    <span style={{ 
      fontSize: '11px', 
      color: '#64748b',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '120px',
    }}>
      {item.store}
    </span>
  </div>
  <span style={{ 
    fontWeight: '700', 
    fontSize: '14px', 
    color: '#0f172a',
    flexShrink: 0,
  }}>
    {item.price}
  </span>
</div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default Home;