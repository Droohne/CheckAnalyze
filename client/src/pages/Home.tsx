import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLiveFeed } from '../api/client';
import { uploadCheck } from '../api/client';

interface FeedItem {
  ProductName: string;
  StoreName: string;
  Price: number;
}

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const { data: feedData, isLoading, refetch } = useQuery({
    queryKey: ['liveFeed'],
    queryFn: () => getLiveFeed().then(r => r.data),
    refetchInterval: 30000,
  });

  const liveFeed = feedData?.map((item: FeedItem) => ({
    product: item.ProductName,
    store: item.StoreName,
    price: `${item.Price} ₽`,
  })) || [];

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    try {
      await uploadCheck(file);
      setUploaded(true);
      setTimeout(() => setUploaded(false), 3000);
      refetch();
    } catch (err: any) {
  console.log('Error object:', err);
  const message = err.response?.data?.message || err.message || 'Upload failed';
  setError(message);
} finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
          
          {error && (
            <div style={{ 
              color: '#ef4444', 
              fontSize: '14px', 
              marginBottom: '12px',
              padding: '8px 12px',
              background: '#fee2e2',
              borderRadius: '6px',
            }}>
              {error}
            </div>
          )}

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
          {liveFeed.length === 0 ? (
            <div style={{ padding: '10px', color: '#64748b' }}>No products yet</div>
          ) : (
            [...liveFeed, ...liveFeed].map((item, i) => (
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
            ))
          )}
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