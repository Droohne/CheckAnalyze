import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLiveFeed } from '../../api/client';
import { uploadCheck } from '../../api/client';
import './Home.css';

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
    return <div className="loading-state">Loading...</div>;
  }

  return (
    <div className="home-container">
      {/* Upload Section */}
      <div className="home-upload-section">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`upload-zone ${dragOver ? 'upload-zone-drag' : ''}`}
        >
          <div className="upload-zone-icon">📄</div>
          <h2 className="upload-zone-title">Загрузите чеки</h2>
          <p className="upload-zone-subtitle">
            Перетащите JSON файлы или выберите из папки
          </p>

          {/* File List */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => {
                const status = uploadStatuses[index];
                return (
                  <div 
                    key={`${file.name}-${index}`}
                    className={`file-item file-item-${status?.status || 'pending'}`}
                  >
                    <div className="file-info">
                      <span className="file-icon">
                        {status?.status === 'uploading' ? '⏳' : 
                         status?.status === 'success' ? '✅' : 
                         status?.status === 'error' ? '❌' : '📎'}
                      </span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    {!uploading && status?.status !== 'success' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="file-remove"
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
            <div key={i} className="upload-error">
              ❌ {status.file.name}: {status.error}
            </div>
          ))}

          {/* Progress */}
          {uploading && totalFiles > 0 && (
            <div className="upload-progress">
              Загружено: {successCount + errorCount} / {totalFiles}
            </div>
          )}

          <div className="upload-file-input-wrapper">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="upload-file-input"
            />
            <div className="upload-file-hint">
              Можно выбрать несколько файлов сразу
            </div>
          </div>

          <div className="upload-actions">
            <button 
              onClick={() => {
                setFiles([]);
                setUploadStatuses([]);
              }}
              disabled={files.length === 0 || uploading}
              className="btn-clear"
            >
              Очистить
            </button>
            <button 
              onClick={handleUploadAll}
              disabled={files.length === 0 || uploading}
              className="btn-upload"
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
      <div className="ticker-container">
        <div className="ticker-wrapper">
          {liveFeed.length === 0 ? (
            <div className="ticker-empty">No products yet</div>
          ) : (
            [...liveFeed, ...liveFeed].map((item, i) => (
              <div key={i} className="ticker-item">
                <div className="ticker-product">
                  <span className="ticker-product-name">{item.product}</span>
                  <span className="ticker-store-name">{item.store}</span>
                </div>
                <span className="ticker-price">{item.price}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;