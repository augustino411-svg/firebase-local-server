'use client';
import { useEffect, useState } from 'react';

export default function TestAnnouncements() {
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

    fetch(`${API_BASE}/api/announcements`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || `錯誤代碼 ${res.status}`);
        }
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>🔄 載入中...</p>;
  if (error) return <p>❌ 錯誤：{error}</p>;
  if (!data || data.length === 0) return <p>📭 尚無公告</p>;

  return (
    <div>
      <h2>📢 公告列表</h2>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> — {item.authorName}
            <br />
            <small>{new Date(item.createdAt).toLocaleString()}</small>
            <p>{item.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}