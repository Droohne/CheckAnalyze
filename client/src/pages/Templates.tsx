import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
}

interface Template {
  id: number;
  name: string;
  products: Product[];
  isDefault: boolean;
}

const defaultTemplates: Template[] = [
  {
    id: 1,
    name: 'Еженедельный',
    isDefault: true,
    products: [
      { id: 1, name: 'Хлеб белый' },
      { id: 2, name: 'Молоко 3.2%' },
      { id: 3, name: 'Яйца куриные' },
      { id: 4, name: 'Сахар песок' },
      { id: 5, name: 'Масло подсолнечное' },
      { id: 6, name: 'Соль поваренная' },
      { id: 7, name: 'Чай черный' },
      { id: 8, name: 'Рис круглозерный' },
      { id: 9, name: 'Гречка ядрица' },
      { id: 10, name: 'Мука пшеничная' },
    ]
  },
  {
    id: 2,
    name: 'Праздничный',
    isDefault: true,
    products: [
      { id: 11, name: 'Мясо свинина' },
      { id: 12, name: 'Рыба красная' },
      { id: 13, name: 'Вино красное' },
      { id: 14, name: 'Сыр твердый' },
      { id: 15, name: 'Оливки' },
      { id: 16, name: 'Колбаса сырокопченая' },
      { id: 17, name: 'Фрукты' },
      { id: 18, name: 'Торт' },
    ]
  },
  {
    id: 3,
    name: 'Спортивный',
    isDefault: true,
    products: [
      { id: 19, name: 'Курица филе' },
      { id: 20, name: 'Рис коричневый' },
      { id: 21, name: 'Брокколи' },
      { id: 22, name: 'Яйца перепелиные' },
      { id: 23, name: 'Овсянка' },
      { id: 24, name: 'Протеин' },
    ]
  },
];

const allProducts = [
  'Хлеб белый', 'Молоко 3.2%', 'Яйца куриные', 'Сахар песок', 
  'Масло подсолнечное', 'Соль поваренная', 'Чай черный', 'Рис круглозерный',
  'Гречка ядрица', 'Мука пшеничная', 'Мясо свинина', 'Рыба красная',
  'Вино красное', 'Сыр твердый', 'Оливки', 'Колбаса сырокопченая',
  'Фрукты', 'Торт', 'Курица филе', 'Рис коричневый',
  'Брокколи', 'Яйца перепелиные', 'Овсянка', 'Протеин',
  'Сметана', 'Творог', 'Кефир', 'Йогурт',
  'Помидоры', 'Огурцы', 'Картофель', 'Морковь',
];

function Templates() {
  const navigate = useNavigate();
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editingDefaultId, setEditingDefaultId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const filteredProducts = allProducts.filter(p => 
    p.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedProducts.includes(p)
  );

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim() || selectedProducts.length === 0) return;
    
    const newTemplate: Template = {
      id: Date.now(),
      name: newTemplateName,
      isDefault: false,
      products: selectedProducts.map((name, index) => ({ id: Date.now() + index, name })),
    };
    
    setUserTemplates([...userTemplates, newTemplate]);
    setNewTemplateName('');
    setSelectedProducts([]);
    setIsCreating(false);
  };

  const handleEditUserTemplate = (id: number) => {
    const template = userTemplates.find(t => t.id === id);
    if (!template) return;
    setNewTemplateName(template.name);
    setSelectedProducts(template.products.map(p => p.name));
    setIsEditing(id);
    setEditingDefaultId(null);
    setOpenMenuId(null);
  };

  const handleEditDefaultTemplate = (template: Template) => {
    setNewTemplateName(template.name + ' (копия)');
    setSelectedProducts(template.products.map(p => p.name));
    setIsEditing(null);
    setEditingDefaultId(template.id);
  };

  const handleCopyTemplate = (template: Template) => {
    setNewTemplateName(template.name + ' (копия)');
    setSelectedProducts(template.products.map(p => p.name));
    setIsCreating(true);
    setIsEditing(null);
    setEditingDefaultId(null);
    setOpenMenuId(null);
  };

  const handleSaveEdit = () => {
    if (isCreating) {
      handleCreateTemplate();
      return;
    }

    if (isEditing !== null) {
      setUserTemplates(userTemplates.map(t => 
        t.id === isEditing 
          ? { ...t, name: newTemplateName, products: selectedProducts.map((name, index) => ({ id: Date.now() + index, name })) }
          : t
      ));
    } else if (editingDefaultId !== null) {
      const defaultTemplate = defaultTemplates.find(t => t.id === editingDefaultId);
      if (defaultTemplate) {
        const newTemplate: Template = {
          id: Date.now(),
          name: newTemplateName,
          isDefault: false,
          products: selectedProducts.map((name, index) => ({ id: Date.now() + index, name })),
        };
        setUserTemplates([...userTemplates, newTemplate]);
      }
    }

    setNewTemplateName('');
    setSelectedProducts([]);
    setIsCreating(false);
    setIsEditing(null);
    setEditingDefaultId(null);
  };

  const handleDeleteUserTemplate = (id: number) => {
    setUserTemplates(userTemplates.filter(t => t.id !== id));
    setOpenMenuId(null);
  };

  const handleTestInShops = (template: Template) => {
    navigate('/shops', { state: { selectedTemplate: template } });
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>📋 Шаблоны продуктов</h1>
        <button 
          onClick={() => {
            setIsCreating(true);
            setNewTemplateName('');
            setSelectedProducts([]);
          }}
          style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          + Создать шаблон
        </button>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>
        Создавайте и редактируйте шаблоны продуктов для сравнения цен в магазинах
      </p>

      {/* Create/Edit Modal */}
      {(isCreating || isEditing !== null || editingDefaultId !== null) && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: '#ffffff', 
            padding: '32px', 
            borderRadius: '16px', 
            maxWidth: '600px', 
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0' }}>
              {isCreating ? 'Создать шаблон' : isEditing !== null ? 'Редактировать шаблон' : 'Копировать шаблон'}
            </h2>
            
            <input 
              type="text" 
              placeholder="Название шаблона..." 
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                fontSize: '14px',
                marginBottom: '16px',
              }}
            />

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Продукты в шаблоне ({selectedProducts.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {selectedProducts.map(p => (
                  <span 
                    key={p} 
                    style={{ 
                      background: '#e2e8f0', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {p}
                    <span 
                      onClick={() => setSelectedProducts(selectedProducts.filter(sp => sp !== p))}
                      style={{ cursor: 'pointer', color: '#ef4444' }}
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Поиск продуктов..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                fontSize: '14px',
                marginBottom: '8px',
              }}
            />

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '6px',
              maxHeight: '150px',
              overflow: 'auto',
              marginBottom: '16px',
            }}>
              {filteredProducts.map(p => (
                <span 
                  key={p}
                  onClick={() => setSelectedProducts([...selectedProducts, p])}
                  style={{ 
                    background: '#f1f5f9', 
                    padding: '4px 12px', 
                    borderRadius: '12px', 
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                  + {p}
                </span>
              ))}
              {filteredProducts.length === 0 && (
                <span style={{ color: '#64748b', fontSize: '14px' }}>Нет доступных продуктов</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleSaveEdit}
                disabled={!newTemplateName.trim() || selectedProducts.length === 0}
                style={{ 
                  padding: '10px 32px', 
                  background: (!newTemplateName.trim() || selectedProducts.length === 0) ? '#94a3b8' : '#0f172a', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: (!newTemplateName.trim() || selectedProducts.length === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                {isCreating ? 'Создать' : 'Сохранить'}
              </button>
              <button 
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(null);
                  setEditingDefaultId(null);
                  setNewTemplateName('');
                  setSelectedProducts([]);
                }}
                style={{ padding: '10px 24px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Templates */}
      {userTemplates.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#0f172a' }}>
            📂 Мои шаблоны
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {userTemplates.map(template => (
              <div key={template.id} style={{ 
                background: '#ffffff', 
                padding: '20px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                    {template.name}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => toggleMenu(template.id)}
                      style={{ 
                        padding: '4px 8px', 
                        background: 'transparent', 
                        border: 'none', 
                        borderRadius: '6px', 
                        fontSize: '20px',
                        cursor: 'pointer',
                        lineHeight: 1,
                        color: '#64748b',
                      }}
                    >
                      ⋮
                    </button>
                    {openMenuId === template.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '1px solid #e2e8f0',
                        minWidth: '160px',
                        zIndex: 10,
                        overflow: 'hidden',
                      }}>
                        <button 
                          onClick={() => handleCopyTemplate(template)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#0f172a',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          📋 Копировать
                        </button>
                        <button 
                          onClick={() => handleEditUserTemplate(template.id)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#0f172a',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          ✏️ Редактировать
                        </button>
                        <button 
                          onClick={() => handleDeleteUserTemplate(template.id)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#ef4444',
                          }}
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ color: '#64748b', fontSize: '14px', margin: '8px 0' }}>
                  {template.products.length} продуктов
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '4px', 
                  marginBottom: '12px',
                  flex: 1,
                }}>
                  {template.products.slice(0, 6).map(p => (
                    <span key={p.id} style={{ 
                      background: '#f1f5f9', 
                      padding: '2px 10px', 
                      borderRadius: '10px', 
                      fontSize: '12px',
                      color: '#475569',
                    }}>
                      {p.name}
                    </span>
                  ))}
                  {template.products.length > 6 && (
                    <span style={{ 
                      background: '#f1f5f9', 
                      padding: '2px 10px', 
                      borderRadius: '10px', 
                      fontSize: '12px',
                      color: '#64748b',
                    }}>
                      +{template.products.length - 6}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleTestInShops(template)}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#6366f1', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: 'auto',
                  }}
                >
                  🛒 Проверить в магазинах
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Default Templates */}
      <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#64748b' }}>
        📦 Стандартные шаблоны
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {defaultTemplates.map(template => (
          <div key={template.id} style={{ 
            background: '#ffffff', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            opacity: 0.85,
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
              {template.name}
            </div>
            <div style={{ color: '#64748b', fontSize: '14px', margin: '8px 0' }}>
              {template.products.length} продуктов
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '4px', 
              marginBottom: '12px',
              flex: 1,
            }}>
              {template.products.slice(0, 6).map(p => (
                <span key={p.id} style={{ 
                  background: '#f1f5f9', 
                  padding: '2px 10px', 
                  borderRadius: '10px', 
                  fontSize: '12px',
                  color: '#475569',
                }}>
                  {p.name}
                </span>
              ))}
              {template.products.length > 6 && (
                <span style={{ 
                  background: '#f1f5f9', 
                  padding: '2px 10px', 
                  borderRadius: '10px', 
                  fontSize: '12px',
                  color: '#64748b',
                }}>
                  +{template.products.length - 6}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button 
                onClick={() => handleTestInShops(template)}
                style={{ 
                  padding: '8px 16px', 
                  background: '#6366f1', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontSize: '13px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                🛒 Проверить в магазинах
              </button>
              <button 
                onClick={() => handleCopyTemplate(template)}
                style={{ 
                  padding: '8px 16px', 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                📋 Копировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Templates;