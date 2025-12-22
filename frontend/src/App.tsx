import React, { useState, useMemo, useEffect } from 'react';
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

const AssetTrackerApp: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePrice, setNewDevicePrice] = useState('');
  const [newDeviceDate, setNewDeviceDate] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<Device['iconType']>('other');

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

  const handleAddDevice = () => {
    if (!newDeviceName || !newDevicePrice || !newDeviceDate) {
      alert("请填写完整信息");
      return;
    }

    const payload = {
      name: newDeviceName,
      price: parseFloat(newDevicePrice),
      purchaseDate: newDeviceDate,
      iconType: newDeviceType
    };

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
  };

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

        {/* --- 设备列表 --- */}
        <div className="list-container">
          {devices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">暂无设备，点击右下角添加</div>
            </div>
          ) : (
            devices.map(device => {
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
                    <button 
                        className="delete-btn" 
                        onClick={(e) => handleDeleteDevice(device.id, e)}
                    >
                        <TrashIcon />
                    </button>
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

        {/* --- 添加设备弹窗 --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">添加新设备</h3>
              
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
                <button className="btn btn-cancel" onClick={() => setIsModalOpen(false)}>取消</button>
                <button className="btn btn-confirm" onClick={handleAddDevice}>完成</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetTrackerApp;