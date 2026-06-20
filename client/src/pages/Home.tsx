import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLiveFeed } from '../api/client';
import { uploadCheck } from '../api/client';

interface FeedItem {
  ProductName: string;
  StoreName: string;
  Price: number;
}

interface UploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFilesSelected = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const jsonFiles = Array.from(newFiles).filter(f => f.name.endsWith('.json'));
    if (jsonFiles.length === 0) return;
    setFiles(prev => [...prev, ...jsonFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const statuses: UploadStatus[] = files.map(file => ({
      file,
      status: 'pending' as const,
    }));
    setUploadStatuses([...statuses]);

    for (let i = 0; i < files.length; i++) {
      statuses[i].status = 'uploading';
      setUploadStatuses([...statuses]);

      try {
        await uploadCheck(files[i]);
        statuses[i].status = 'success';
      } catch (err: any) {
        statuses[i].status = 'error';
        statuses[i].error = err.response?.data?.message || err.message || 'Upload failed';
      }
      setUploadStatuses([...statuses]);
    }

    setUploading(false);
    refetch();

    setTimeout(() => {
      setFiles(prev => prev.filter((_, i) => statuses[i]?.status !== 'success'));
      setUploadStatuses([]);
    }, 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const successCount = uploadStatuses.filter(s => s.status === 'success').length;
  const errorCount = uploadStatuses.filter(s => s.status === 'error').length;
  const totalFiles = files.length;

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
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            background: dragOver ? '#f0f9ff' : '#ffffff', 
            padding: '28px 40px', 
            borderRadius: '16px', 
            border: dragOver ? '2px dashed #3b82f6' : '2px dashed #e2e8f0',
            textAlign: 'center',
            width: '100%',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>Загрузите чеки</h2>
          <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '14px' }}>
            Перетащите JSON файлы или выберите из папки
          </p>

          {/* File List */}
          {files.length > 0 && (
            <div style={{ 
              marginBottom: '12px',
              maxHeight: '200px',
              overflowY: 'auto',
              textAlign: 'left',
            }}>
              {files.map((file, index) => {
                const status = uploadStatuses[index];
                return (
                  <div 
                    key={`${file.name}-${index}`}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: status?.status === 'success' ? '#f0fdf4' : 
                                  status?.status === 'error' ? '#fef2f2' : '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span>
                        {status?.status === 'uploading' ? '⏳' : 
                         status?.status === 'success' ? '✅' : 
                         status?.status === 'error' ? '❌' : '📎'}
                      </span>
                      <span style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {file.name}
                      </span>
                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    {!uploading && status?.status !== 'success' && (
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          fontSize: '16px',
                          padding: '0 4px',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Messages */}
          {uploadStatuses.filter(s => s.status === 'error').map((status, i) => (
            <div key={i} style={{ 
              color: '#ef4444', 
              fontSize: '13px', 
              marginBottom: '8px',
              padding: '8px 12px',
              background: '#fee2e2',
              borderRadius: '6px',
              textAlign: 'left',
            }}>
              ❌ {status.file.name}: {status.error}
            </div>
          ))}

          {/* Progress */}
          {uploading && totalFiles > 0 && (
            <div style={{ marginBottom: '12px', fontSize: '14px', color: '#0f172a' }}>
              Загружено: {successCount + errorCount} / {totalFiles}
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
              ref={fileInputRef}
              type="file" 
              accept=".json"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              style={{ width: '100%', fontSize: '14px' }}
            />
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
              Можно выбрать несколько файлов сразу
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                setFiles([]);
                setUploadStatuses([]);
              }}
              disabled={files.length === 0 || uploading}
              style={{ 
                padding: '10px 24px', 
                background: '#f1f5f9', 
                color: '#64748b', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '14px',
                cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
              }}
            >
              Очистить
            </button>
            <button 
              onClick={handleUploadAll}
              disabled={files.length === 0 || uploading}
              style={{ 
                padding: '10px 40px', 
                background: files.length === 0 || uploading ? '#94a3b8' : '#0f172a', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '15px',
                fontWeight: '500',
                cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading 
                ? `⏳ Загрузка ${successCount + errorCount}/${totalFiles}...` 
                : successCount === totalFiles && totalFiles > 0 
                  ? '✅ Всё загружено!' 
                  : `Загрузить ${files.length > 1 ? `(${files.length})` : ''}`
              }
            </button>
          </div>
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