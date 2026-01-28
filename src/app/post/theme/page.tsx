'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addIdea, getActiveTheme, Theme } from '@/lib/firestore';

export default function ThemePostPage() {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'online' as 'online' | 'offline',
    targetPeople: '',
    problem: '',
    successCriteria: ''
  });

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const theme = await getActiveTheme();
        setActiveTheme(theme);
        if (!theme) {
          router.push('/post/select');
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
        router.push('/post/select');
      }
    };
    fetchTheme();
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
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('タイトルと内容は必須です');
      return;
    }

    if (formData.description.length > 200) {
      setError('内容は200文字以内で入力してください');
      return;
    }

    if (!activeTheme) {
      setError('テーマが見つかりません');
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
        themeId: activeTheme.id,
        ...(formData.problem && { problem: formData.problem }),
        ...(formData.successCriteria && { successCriteria: formData.successCriteria })
      };
      
      await addIdea(ideaData);
      
      router.push('/');
    } catch (error: any) {
      setError('投稿に失敗しました。再度お試しください。');
      console.error('Error adding idea:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!activeTheme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ZERO-ONE</h1>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                トップ
              </Link>
              <Link href="/post" className="text-blue-600 font-semibold">
                投稿
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* テーマ情報 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600 mb-1">今月のテーマ</p>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">{activeTheme.title}</h3>
            <p className="text-sm text-blue-700 mb-2">{activeTheme.description}</p>
            <p className="text-xs text-blue-600">
              募集期間: {activeTheme.startDate.toDate().toLocaleDateString('ja-JP')} 〜 {activeTheme.endDate.toDate().toLocaleDateString('ja-JP')}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              このテーマに沿ったアイデアを投稿してください。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
              テーマ投稿
            </span>
            <h2 className="text-2xl font-bold text-gray-900">アイデアを投稿する</h2>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="アイデアのタイトルを入力"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                内容 *（200文字以内）
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="アイデアの詳細を200文字以内で説明"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                {formData.description.length}/200文字
              </p>
            </div>

            {/* テーマ関連項目 */}
            <div>
              <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">
                何を解決したいか
              </label>
              <textarea
                id="problem"
                name="problem"
                value={formData.problem}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="このアイデアでどんな問題を解決したいですか？"
              />
            </div>

            <div>
              <label htmlFor="successCriteria" className="block text-sm font-medium text-gray-700 mb-2">
                どんな形になれば成功か
              </label>
              <textarea
                id="successCriteria"
                name="successCriteria"
                value={formData.successCriteria}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="どうなったら「成功」と言えますか？"
              />
            </div>

            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-2">
                実施形式 *
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="online">オンライン</option>
                <option value="offline">オフライン</option>
              </select>
            </div>

            <div>
              <label htmlFor="targetPeople" className="block text-sm font-medium text-gray-700 mb-2">
                求める人
              </label>
              <input
                type="text"
                id="targetPeople"
                name="targetPeople"
                value={formData.targetPeople}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="例：一緒に企画してくれる人、初心者OKの人など"
              />
              <p className="text-sm text-gray-500 mt-1">
                どんな人を求めているか自由に記述（任意）
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '投稿中...' : 'テーマで投稿する'}
              </button>
              <Link
                href="/post/select"
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md font-semibold hover:bg-gray-300 transition-colors text-center"
              >
                戻る
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
