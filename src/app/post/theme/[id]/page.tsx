'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { addIdea } from '@/lib/firestore';
import { getThemes, Theme } from '@/lib/firestore';

export default function ThemePostPage() {
  const params = useParams();
  const router = useRouter();
  const themeId = params.id as string;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'online' as 'online' | 'offline',
    reason: '',
    target: ''
  });

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const themesData = await getThemes();
        const foundTheme = themesData.find(t => t.id === themeId);
        if (!foundTheme) {
          router.push('/');
          return;
        }
        setTheme(foundTheme);
      } catch (error) {
        console.error('Error fetching theme:', error);
        router.push('/');
      }
    };

    fetchTheme();
  }, [themeId, router]);

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

    setLoading(true);
    setError('');

    try {
      const ideaData = {
        title: formData.title,
        description: formData.description,
        mode: formData.mode,
        status: 'idea' as const,
        themeId: themeId
      };

      await addIdea(ideaData);

      router.push(`/theme/${themeId}`);
    } catch (error: any) {
      setError('投稿に失敗しました。再度お試しください。');
      console.error('Error adding idea:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!theme) {
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
            <Link href="/" className="text-3xl font-bold text-gray-900">Buildea</Link>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                トップ
              </Link>
              <Link href="/ideas" className="text-gray-700 hover:text-gray-900">
                アイデア一覧
              </Link>
              <Link href="/post/select" className="text-gray-700 hover:text-gray-900">
                投稿
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <Link href={`/theme/${themeId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← テーマ詳細に戻る
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">アイデア投稿</h2>
            <p className="text-gray-600">テーマ：{theme.title}</p>
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
                内容（短くてOK）*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="アイデアの内容を簡潔に説明"
                required
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

            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-700 mb-4">（任意）</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    実現したい理由
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="なぜこのアイデアを実現したいのか"
                  />
                </div>

                <div>
                  <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
                    誰向けか
                  </label>
                  <input
                    type="text"
                    id="target"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="例：学生全体、1年生、など"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '投稿中...' : '投稿する'}
              </button>
              <Link
                href={`/theme/${themeId}`}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md font-semibold hover:bg-gray-300 transition-colors text-center"
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
