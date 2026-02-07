import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css'; // 确保引入了下方的 CSS

// --- 类型定义 ---
interface Device {
  id: string;
  name: string;
  price: number;
  purchaseDate: string; // YYYY-MM-DD
  iconType: 'phone' | 'laptop' | 'watch' | 'headphone' | 'tablet' | 'other';
}

// --- 辅助函数 ---
const calculateDaysOwned = (dateString: string): number => {
  const purchaseDate = new Date(dateString);
  const today = new Date();
  purchaseDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 1 : diffDays;
};

const formatCurrency = (amount: number) => {
  return `¥${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- SVG 图标组件 (保持不变) ---
const DeviceIcon = ({ type }: { type: string }) => {
  const className = "device-icon-svg";
  switch (type) {
    case 'phone': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;
    case 'laptop': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>;
    case 'watch': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><rect x="8" y="18" width="8" height="4" rx="1" ry="1"></rect><rect x="4" y="6" width="16" height="12" rx="2" ry="2"></rect></svg>;
    case 'headphone': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>;
    case 'tablet': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;
    default: return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
  }
};

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

type SortType = 'price' | 'dailyCost' | 'days' | 'default';
type SortOrder = 'asc' | 'desc';

const AssetTrackerApp: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePrice, setNewDevicePrice] = useState('');
  const [newDeviceDate, setNewDeviceDate] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<Device['iconType']>('other');
  
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    // 模拟数据加载（如果你还没有后端，先用这个注释掉的代码测试 UI）
    /*
    const mockData: Device[] = [
      { id: '1', name: 'iPhone 15 Pro', price: 8999, purchaseDate: '2023-10-01', iconType: 'phone' }
    ];
    setDevices(mockData);
    */

    fetch('/api/devices')
      .then(res => {
        if (!res.ok) throw new Error('网络响应不正常');
        return res.json();
      })
      .then(data => setDevices(data))
      .catch(err => console.error("加载设备列表失败:", err));
  }, []);

  const summary = useMemo(() => {
    let totalAsset = 0;
    let totalDailyCost = 0;
    devices.forEach(device => {
      const days = calculateDaysOwned(device.purchaseDate);
      totalAsset += device.price;
      totalDailyCost += (device.price / days);
    });
    return { totalAsset, totalDailyCost };
  }, [devices]);

  // 排序后的设备列表
  const sortedDevices = useMemo(() => {
    if (sortBy === 'default') return devices;
    
    const withMetrics = devices.map(device => ({
      ...device,
      daysOwned: calculateDaysOwned(device.purchaseDate),
      dailyCost: device.price / calculateDaysOwned(device.purchaseDate)
    }));
    
    return [...withMetrics].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'dailyCost') comparison = a.dailyCost - b.dailyCost;
      else if (sortBy === 'days') comparison = a.daysOwned - b.daysOwned;
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [devices, sortBy, sortOrder]);

  // 图表数据
  const pieChartData = useMemo(() => {
    const typeMap: { [key: string]: number } = {};
    devices.forEach(device => {
      typeMap[device.iconType] = (typeMap[device.iconType] || 0) + device.price;
    });
    
    const typeLabels: { [key: string]: string } = {
      phone: '手机',
      laptop: '电脑',
      watch: '手表',
      headphone: '耳机',
      tablet: '平板',
      other: '其他'
    };
    
    return Object.entries(typeMap).map(([type, value]) => ({
      name: typeLabels[type] || type,
      value
    }));
  }, [devices]);

  const barChartData = useMemo(() => {
    return devices.map(device => ({
      name: device.name.length > 8 ? device.name.substring(0, 8) + '...' : device.name,
      value: device.price / calculateDaysOwned(device.purchaseDate),
      fullName: device.name
    })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [devices]);

  const COLORS = ['#007aff', '#52c41a', '#ff7a45', '#ffc53d', '#722ed1', '#9254de'];

  const handleAddDevice = () => {
    if (!newDeviceName || !newDevicePrice || !newDeviceDate) {
      alert("请填写完整信息");
      return;
    }

    // 验证日期不能是未来日期
    const purchaseDate = new Date(newDeviceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    purchaseDate.setHours(0, 0, 0, 0);
    
    if (purchaseDate > today) {
      alert("购买日期不能是未来日期");
      return;
    }

    const payload = {
      name: newDeviceName,
      price: parseFloat(newDevicePrice),
      purchaseDate: newDeviceDate,
      iconType: newDeviceType
    };

    if (isEditMode && editingDeviceId) {
      // 编辑模式
      fetch(`/api/devices/${editingDeviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(res => {
        if (!res.ok) throw new Error('更新失败');
        return res.json();
      })
      .then((updatedDevice: Device) => {
        setDevices(devices.map(d => d.id === editingDeviceId ? updatedDevice : d));
        resetForm();
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingDeviceId(null);
      })
      .catch(err => {
        alert("更新设备出错: " + err.message);
      });
    } else {
      // 添加模式
      fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(res => {
        if (!res.ok) throw new Error('添加失败');
        return res.json();
      })
      .then((savedDevice: Device) => {
        setDevices([savedDevice, ...devices]);
        resetForm();
        setIsModalOpen(false);
      })
      .catch(err => {
        alert("添加设备出错: " + err.message);
      });
    }
  };

  const handleDeleteDevice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个设备吗？')) {
      fetch(`/api/devices/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('删除失败');
        setDevices(devices.filter(d => d.id !== id));
      })
      .catch(err => {
        alert("删除设备出错: " + err.message);
      });
    }
  };

  const resetForm = () => {
    setNewDeviceName('');
    setNewDevicePrice('');
    setNewDeviceDate('');
    setNewDeviceType('other');
    setIsEditMode(false);
    setEditingDeviceId(null);
  };

  const handleEditDevice = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingDeviceId(device.id);
    setNewDeviceName(device.name);
    setNewDevicePrice(device.price.toString());
    setNewDeviceDate(device.purchaseDate);
    setNewDeviceType(device.iconType);
    setIsModalOpen(true);
  };

  const EditIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {/* --- 顶部总览卡片 --- */}
        <div className="header-card">
          <div className="header-top-row">
            <span className="header-title">我的资产</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-label">总资产</div>
              <div className="stat-value">{formatCurrency(summary.totalAsset)}</div>
            </div>
            <div className="divider"></div>
            <div className="stat-item">
              <div className="stat-label">总日均</div>
              <div className="stat-value">{formatCurrency(summary.totalDailyCost)}</div>
            </div>
          </div>
        </div>

        {/* --- 排序和图表控制 --- */}
        <div className="controls-container">
          <div className="sort-controls">
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
            >
              <option value="default">默认排序</option>
              <option value="price">按价格</option>
              <option value="dailyCost">按日均成本</option>
              <option value="days">按拥有天数</option>
            </select>
            
            <button 
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              disabled={sortBy === 'default'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <button 
            className="chart-toggle-btn"
            onClick={() => setShowChart(!showChart)}
          >
            {showChart ? '隐藏图表' : '显示图表'}
          </button>
        </div>

        {/* --- 图表区域 --- */}
        {showChart && (
          <div className="charts-container">
            <div className="chart-tabs">
              <button 
                className={`chart-tab ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                资产分布
              </button>
              <button 
                className={`chart-tab ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                日均成本 TOP10
              </button>
            </div>
            
            <div className="chart-content">
              {chartType === 'pie' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value?: number) => value !== undefined ? formatCurrency(value) : ''} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value?: number) => value !== undefined ? `¥${value.toFixed(1)}/天` : ''}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data?.fullName || label;
                      }}
                    />
                    <Bar dataKey="value" fill="#007aff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* --- 设备列表 --- */}
        <div className="list-container">
          {devices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">暂无设备，点击右下角添加</div>
            </div>
          ) : (
            sortedDevices.map(device => {
              const daysOwned = calculateDaysOwned(device.purchaseDate);
              const dailyCost = device.price / daysOwned;

              return (
                <div key={device.id} className="device-card">
                  <div className="card-left">
                    <div className="icon-wrapper">
                        <DeviceIcon type={device.iconType} />
                    </div>
                    <div className="device-info">
                        <div className="device-name">{device.name}</div>
                        <div className="device-meta">
                        <span className="device-price">{formatCurrency(device.price)}</span>
                        <span className="dot-separator">•</span>
                        <span className="device-daily">¥{dailyCost.toFixed(1)}/天</span>
                        </div>
                    </div>
                  </div>

                  <div className="card-right">
                    <div className="days-wrapper">
                        <span className="days-count">{daysOwned}</span>
                        <span className="days-label">天</span>
                    </div>
                    <div className="card-actions">
                      <button 
                          className="edit-btn" 
                          onClick={(e) => handleEditDevice(device, e)}
                      >
                          <EditIcon />
                      </button>
                      <button 
                          className="delete-btn" 
                          onClick={(e) => handleDeleteDevice(device.id, e)}
                      >
                          <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- 悬浮添加按钮 (FAB) --- */}
        <button className="fab" onClick={() => setIsModalOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>

        {/* --- 添加/编辑设备弹窗 --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">{isEditMode ? '编辑设备' : '添加新设备'}</h3>
              
              <div className="input-group">
                <label className="input-label">设备名称</label>
                <input 
                  className="form-input"
                  value={newDeviceName} 
                  onChange={(e) => setNewDeviceName(e.target.value)} 
                  placeholder="例如: iPhone 16"
                />
              </div>

              <div className="input-group">
                <label className="input-label">价格 (元)</label>
                <input 
                  className="form-input"
                  type="number" 
                  value={newDevicePrice} 
                  onChange={(e) => setNewDevicePrice(e.target.value)} 
                  placeholder="8999"
                />
              </div>

              <div className="input-group">
                <label className="input-label">购买日期</label>
                <input 
                  className="form-input"
                  type="date" 
                  value={newDeviceDate} 
                  onChange={(e) => setNewDeviceDate(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label className="input-label">类型</label>
                <select 
                  className="form-select"
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value as any)}
                >
                  <option value="phone">手机</option>
                  <option value="laptop">电脑</option>
                  <option value="watch">手表</option>
                  <option value="headphone">耳机</option>
                  <option value="tablet">平板</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-cancel" 
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  取消
                </button>
                <button className="btn btn-confirm" onClick={handleAddDevice}>
                  {isEditMode ? '保存' : '完成'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetTrackerApp;