import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDefaultTemplates,
  getUserTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  copyTemplate,
  getProducts,
} from '../../api/client';
import './Templates.css';

interface Product {
  ID: number;
  ProductName: string;
}

interface TemplateProduct {
  id: number;
  product_name_id: number;
  product_name: string;
  amount_or_weight: number;
}

interface Template {
  id: number;
  name: string;
  is_default: boolean;
  products: TemplateProduct[];
}

interface SelectedProduct {
  productId: number;
  name: string;
  amount: number;
}

function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editingDefaultId, setEditingDefaultId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const { data: userTemplates = [], isLoading: userLoading } = useQuery<Template[]>({
    queryKey: ['userTemplates'],
    queryFn: () => getUserTemplates().then(r => r.data || []),
  });

  const { data: defaultTemplates = [], isLoading: defaultLoading } = useQuery<Template[]>({
    queryKey: ['defaultTemplates'],
    queryFn: () => getDefaultTemplates().then(r => r.data || []),
  });

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data || []),
  });

  const uniqueProducts: Product[] = allProducts 
    ? Object.values(
        allProducts.reduce((acc: Record<string, Product>, p: Product) => {
          if (!acc[p.ProductName]) acc[p.ProductName] = p;
          return acc;
        }, {} as Record<string, Product>)
      )
    : [];

  const filteredProducts = uniqueProducts.filter(
    (p: Product) =>
      p.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedProducts.find(sp => sp.productId === p.ID)
  );

  const createMutation = useMutation({
    mutationFn: (data: { name: string; products: { product_name_id: number; amount_or_weight: number }[] }) =>
      createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTemplates'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name: string; products: { product_name_id: number; amount_or_weight: number }[] }) =>
      updateTemplate(data.id, { name: data.name, products: data.products }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTemplates'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userTemplates'] }),
  });

  const copyMutation = useMutation({
    mutationFn: (data: { id: number; name: string }) => copyTemplate(data.id, data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTemplates'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setNewTemplateName('');
    setSelectedProducts([]);
    setIsCreating(false);
    setIsEditing(null);
    setEditingDefaultId(null);
    setOpenMenuId(null);
  };

  const handleCreateOrSave = () => {
    if (!newTemplateName.trim() || selectedProducts.length === 0) return;
    const products = selectedProducts.map(sp => ({
      product_name_id: sp.productId,
      amount_or_weight: sp.amount,
    }));
    if (isCreating) createMutation.mutate({ name: newTemplateName, products });
    else if (isEditing !== null) updateMutation.mutate({ id: isEditing, name: newTemplateName, products });
    else if (editingDefaultId !== null) copyMutation.mutate({ id: editingDefaultId, name: newTemplateName });
  };

  const handleEditUserTemplate = (template: Template) => {
    setNewTemplateName(template.name);
    setSelectedProducts(template.products.map(p => ({ productId: p.product_name_id, name: p.product_name, amount: p.amount_or_weight || 1 })));
    setIsEditing(template.id);
    setEditingDefaultId(null);
    setOpenMenuId(null);
  };

  const handleCopyTemplate = (template: Template) => {
    setNewTemplateName(template.name + ' (копия)');
    setSelectedProducts(template.products.map(p => ({ productId: p.product_name_id, name: p.product_name, amount: p.amount_or_weight || 1 })));
    setIsCreating(true);
    setIsEditing(null);
    setEditingDefaultId(null);
    setOpenMenuId(null);
  };

  const handleTestInShops = (template: Template) => {
    navigate('/shops', { state: { selectedTemplate: { products: template.products.map(p => p.product_name) } } });
  };

  const addProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, { productId: product.ID, name: product.ProductName, amount: 1 }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateAmount = (index: number, amount: number) => {
    const updated = [...selectedProducts];
    updated[index].amount = amount || 1;
    setSelectedProducts(updated);
  };

  if (userLoading || defaultLoading) {
    return <div className="loading-state">Загрузка...</div>;
  }

  return (
    <div className="templates-container">
      <div className="page-header">
        <h1 className="page-title">📋 Шаблоны продуктов</h1>
        <button 
          onClick={() => { setIsCreating(true); setNewTemplateName(''); setSelectedProducts([]); }}
          className="btn btn-primary"
        >
          + Создать шаблон
        </button>
      </div>
      <p className="page-subtitle">Создавайте и редактируйте шаблоны продуктов для сравнения цен в магазинах</p>

      {(isCreating || isEditing !== null || editingDefaultId !== null) && (
        <div className="modal-overlay">
          <div className="template-modal">
            <h2 className="template-modal-title">
              {isCreating ? 'Создать шаблон' : isEditing !== null ? 'Редактировать шаблон' : 'Копировать шаблон'}
            </h2>
            <input 
              type="text" 
              placeholder="Название шаблона..." 
              value={newTemplateName} 
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="input"
              style={{ marginBottom: 'var(--spacing-md)' }}
            />
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div className="template-products-label">
                Продукты в шаблоне ({selectedProducts.length})
              </div>
              <div className="template-product-list">
                {selectedProducts.map((sp, i) => (
                  <div key={i} className="template-product-item">
                    <span className="template-product-name">{sp.name}</span>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="0.1" 
                      value={sp.amount} 
                      onChange={(e) => updateAmount(i, parseFloat(e.target.value))}
                      className="template-product-amount"
                    />
                    <span 
                      onClick={() => removeProduct(i)} 
                      className="template-product-remove"
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <input 
              type="text" 
              placeholder="Поиск продуктов..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ marginBottom: 'var(--spacing-sm)' }}
            />
            <div className="template-product-search">
              {filteredProducts.map((p: Product) => (
                <span 
                  key={p.ID} 
                  onClick={() => addProduct(p)} 
                  className="template-product-suggestion"
                >
                  + {p.ProductName}
                </span>
              ))}
            </div>
            <div className="template-modal-actions">
              <button 
                onClick={handleCreateOrSave} 
                disabled={!newTemplateName.trim() || selectedProducts.length === 0 || createMutation.isPending || updateMutation.isPending}
                className="template-modal-btn template-modal-btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : isCreating ? 'Создать' : 'Сохранить'}
              </button>
              <button 
                onClick={resetForm} 
                className="template-modal-btn template-modal-btn-ghost"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {userTemplates.length > 0 && (
        <>
          <h2 className="templates-section-title">📂 Мои шаблоны</h2>
          <div className="templates-grid">
            {userTemplates.map((template: Template) => (
              <div key={template.id} className="template-card">
                <div className="template-card-header">
                  <div className="template-card-name">{template.name}</div>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                      className="btn btn-ghost"
                      style={{ fontSize: 'var(--font-size-2xl)', padding: 'var(--spacing-xs) var(--spacing-sm)', lineHeight: 1 }}
                    >
                      ⋮
                    </button>
                    {openMenuId === template.id && (
                      <div className="dropdown-menu">
                        <button 
                          onClick={() => handleCopyTemplate(template)} 
                          className="dropdown-item"
                        >
                          📋 Копировать
                        </button>
                        <button 
                          onClick={() => handleEditUserTemplate(template)} 
                          className="dropdown-item"
                        >
                          ✏️ Редактировать
                        </button>
                        <button 
                          onClick={() => deleteMutation.mutate(template.id)} 
                          className="dropdown-item dropdown-item-danger"
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="template-card-meta">{template.products.length} продуктов</div>
                <div className="template-card-tags">
                  {template.products.slice(0, 6).map((p) => (
                    <span key={p.id} className="template-tag">{p.product_name}</span>
                  ))}
                </div>
                <button 
                  onClick={() => handleTestInShops(template)} 
                  className="template-card-btn"
                >
                  🛒 Проверить в магазинах
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {defaultTemplates.length > 0 && (
        <>
          <h2 className="templates-section-title templates-section-title-muted">📦 Стандартные шаблоны</h2>
          <div className="templates-grid">
            {defaultTemplates.map((template: Template) => (
              <div key={template.id} className="template-card template-default-card">
                <div className="template-card-name">{template.name}</div>
                <div className="template-card-meta">{template.products.length} продуктов</div>
                <div className="template-card-tags">
                  {template.products.slice(0, 6).map((p) => (
                    <span key={p.id} className="template-tag">{p.product_name}</span>
                  ))}
                </div>
                <div className="template-card-actions">
                  <button 
                    onClick={() => handleTestInShops(template)} 
                    className="template-card-action-btn template-card-action-btn-primary"
                  >
                    🛒 Проверить в магазинах
                  </button>
                  <button 
                    onClick={() => handleCopyTemplate(template)} 
                    className="template-card-action-btn template-card-action-btn-ghost"
                  >
                    📋 Копировать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Templates;