'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getThemes, Theme, getIdeas, Idea } from '@/lib/firestore';

export default function ThemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const themeId = params.id as string;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const themesData = await getThemes();
        const ideasData = await getIdeas();
        
        const foundTheme = themesData.find(t => t.id === themeId);
        if (!foundTheme) {
          router.push('/');
          return;
        }
        
        setTheme(foundTheme);
        
        // このテーマに関連するアイデアを取得
        const themeIdeas = ideasData.filter(idea => idea.themeId === themeId);
        setIdeas(themeIdeas);
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [themeId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">テーマが見つかりませんでした</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            トップページに戻る
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
            <Link href="/" className="text-3xl font-bold text-gray-900">ZERO-ONE</Link>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* テーマ詳細 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{theme.title}</h1>
            <div className="text-lg text-gray-600 mb-4">
              {theme.startDate.toDate().toLocaleDateString('ja-JP')} 〜 {theme.endDate.toDate().toLocaleDateString('ja-JP')}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">【テーマ説明】</h2>
            <div className="text-blue-800">
              <p className="mb-2"><strong>なぜこのテーマ？</strong></p>
              <p className="mb-4">{theme.description}</p>
              <p><strong>どんなアイデアを期待しているか</strong></p>
              <p>学生生活をより良くするための具体的なアイデアを期待しています。小さな改善から大胆な提案まで、ぜひ投稿してください。</p>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              href={`/post/theme/${themeId}`}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              アイデアを投稿する
            </Link>
          </div>
        </div>

        {/* みんなのアイデア */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">【みんなのアイデア】</h2>
          
          {ideas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">まだこのテーマでのアイデアがありません</p>
              <Link
                href={`/post/theme/${themeId}`}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                最初のアイデアを投稿する
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/idea/${idea.id}`}
                  className="border border-gray-200 rounded-lg p-4 block hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <span className="text-lg mr-1">👍</span>
                          <span className="font-semibold">{idea.likes}</span>
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            idea.status === 'idea'
                              ? 'bg-yellow-100 text-yellow-800'
                              : idea.status === 'preparing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {idea.status === 'idea' ? '募集中' : 
                           idea.status === 'preparing' ? '検討中' : 'イベント化'}
                        </span>
                        <span>{idea.mode === 'online' ? 'オンライン' : 'オフライン'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
