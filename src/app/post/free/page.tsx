'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addIdea } from '@/lib/firestore';
import { firebaseAuth } from '@/lib/auth';

export default function FreePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'online' as 'online' | 'offline'
  });

  useEffect(() => {
    // ログイン状態を確認
    const user = firebaseAuth.getCurrentUser();
    if (!user) {
      // ログインしていない場合はログイン画面へリダイレクト
      router.push('/login?redirect=' + encodeURIComponent('/post/free'));
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('ログインが必要です');
      return;
    }
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('タイトルと内容は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ideaData = {
        title: formData.title,
        description: formData.description,
        mode: formData.mode,
        status: 'idea' as const,
        userId: currentUser.id // ユーザーIDを含める
      };
      
      await addIdea(ideaData);
      
      alert('アイデアを投稿しました！');
      router.push('/');
    } catch (error: any) {
      setError('投稿に失敗しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // ログインしていない場合の表示
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <Link 
            href="/login?redirect=/post/free"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ログインする
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← トップに戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">自由投稿</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">アイデアを投稿する</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="アイデアのタイトルを入力"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="アイデアの詳細を説明"
                required
              />
            </div>

            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-2">
                実施形式
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="online">オンライン</option>
                <option value="offline">オフライン</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '投稿中...' : '投稿する'}
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
