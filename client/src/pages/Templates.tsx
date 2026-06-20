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
} from '../api/client';

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
    return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', textAlign: 'center' }}><div style={{ fontSize: '18px', color: '#64748b' }}>Загрузка...</div></div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>📋 Шаблоны продуктов</h1>
        <button onClick={() => { setIsCreating(true); setNewTemplateName(''); setSelectedProducts([]); }}
          style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Создать шаблон</button>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>Создавайте и редактируйте шаблоны продуктов для сравнения цен в магазинах</p>

      {(isCreating || isEditing !== null || editingDefaultId !== null) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0' }}>{isCreating ? 'Создать шаблон' : isEditing !== null ? 'Редактировать шаблон' : 'Копировать шаблон'}</h2>
            <input type="text" placeholder="Название шаблона..." value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '16px' }} />
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Продукты в шаблоне ({selectedProducts.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                {selectedProducts.map((sp, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '12px', fontSize: '13px' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.name}</span>
                    <input type="number" min="0.1" step="0.1" value={sp.amount} onChange={(e) => updateAmount(i, parseFloat(e.target.value))}
                      style={{ width: '55px', padding: '2px 4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'center' }} />
                    <span onClick={() => removeProduct(i)} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}>×</span>
                  </div>
                ))}
              </div>
            </div>
            <input type="text" placeholder="Поиск продуктов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '8px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '150px', overflow: 'auto', marginBottom: '16px' }}>
              {filteredProducts.map((p: Product) => (
                <span key={p.ID} onClick={() => addProduct(p)} style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}>+ {p.ProductName}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreateOrSave} disabled={!newTemplateName.trim() || selectedProducts.length === 0 || createMutation.isPending || updateMutation.isPending}
                style={{ padding: '10px 32px', background: (!newTemplateName.trim() || selectedProducts.length === 0) ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: (!newTemplateName.trim() || selectedProducts.length === 0) ? 'not-allowed' : 'pointer' }}>
                {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : isCreating ? 'Создать' : 'Сохранить'}</button>
              <button onClick={resetForm} style={{ padding: '10px 24px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {userTemplates.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#0f172a' }}>📂 Мои шаблоны</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {userTemplates.map((template: Template) => (
              <div key={template.id} style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>{template.name}</div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                      style={{ padding: '4px 8px', background: 'transparent', border: 'none', borderRadius: '6px', fontSize: '20px', cursor: 'pointer', lineHeight: 1, color: '#64748b' }}>⋮</button>
                    {openMenuId === template.id && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', minWidth: '160px', zIndex: 10, overflow: 'hidden' }}>
                        <button onClick={() => handleCopyTemplate(template)} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '14px', cursor: 'pointer', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>📋 Копировать</button>
                        <button onClick={() => handleEditUserTemplate(template)} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '14px', cursor: 'pointer', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>✏️ Редактировать</button>
                        <button onClick={() => deleteMutation.mutate(template.id)} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '14px', cursor: 'pointer', color: '#ef4444' }}>🗑️ Удалить</button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ color: '#64748b', fontSize: '14px', margin: '8px 0' }}>{template.products.length} продуктов</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px', flex: 1 }}>
                  {template.products.slice(0, 6).map((p) => (
                    <span key={p.id} style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', color: '#475569' }}>{p.product_name}</span>
                  ))}
                </div>
                <button onClick={() => handleTestInShops(template)} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', width: '100%', marginTop: 'auto' }}>🛒 Проверить в магазинах</button>
              </div>
            ))}
          </div>
        </>
      )}

      {defaultTemplates.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#64748b' }}>📦 Стандартные шаблоны</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {defaultTemplates.map((template: Template) => (
              <div key={template.id} style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', opacity: 0.85 }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>{template.name}</div>
                <div style={{ color: '#64748b', fontSize: '14px', margin: '8px 0' }}>{template.products.length} продуктов</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px', flex: 1 }}>
                  {template.products.slice(0, 6).map((p) => (
                    <span key={p.id} style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', color: '#475569' }}>{p.product_name}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button onClick={() => handleTestInShops(template)} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', flex: 1 }}>🛒 Проверить в магазинах</button>
                  <button onClick={() => handleCopyTemplate(template)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>📋 Копировать</button>
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