'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasData, activeThemeData, themesData] = await Promise.all([
          getIdeas(),
          getActiveTheme(),
          getThemes()
        ]);
        setIdeas(ideasData);
        setActiveTheme(activeThemeData);
        setThemes(themesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // テーマ名を取得するヘルパー関数
  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.title : '不明なテーマ';
  };

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
              <Link href="/ideas" className="text-gray-700 hover:text-gray-900">
                アイデア一覧
              </Link>
              {user ? (
                <>
                  <Link href={`/user/${user.id}`} className="text-blue-600 font-semibold">
                    マイページ
                  </Link>
                  <Link href="/login" className="text-gray-700 hover:text-gray-900">
                    ログアウト
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-gray-900">
                    ログイン
                  </Link>
                  <Link href="/signup" className="text-gray-700 hover:text-gray-900">
                    アカウント作成
                  </Link>
                </>
              )}
              <Link href="/about" className="text-gray-700 hover:text-gray-900">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* サービス説明 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">ZERO-ONE</h1>
          <p className="text-2xl text-gray-600 mb-8">アイデアを、0から1にする掲示板</p>
        </div>

        {/* 今月のテーマ */}
        {activeTheme && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-16">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">【今月のテーマ】</p>
              <h2 className="text-3xl font-bold mb-4">{activeTheme.title}</h2>
              <div className="text-lg mb-6 opacity-90">
                {activeTheme.description}
              </div>
              <div className="flex justify-center items-center gap-6 text-sm mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full">
                  期限: {activeTheme.endDate.toDate().toLocaleDateString('ja-JP')}
                </span>
              </div>
              <Link
                href={`/theme/${activeTheme.id}`}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-lg"
              >
                このテーマで考える
              </Link>
            </div>
          </div>
        )}

        {/* 過去のテーマ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-16">
          <h3 className="text-xl font-bold text-gray-900 mb-4">【過去のテーマ】</h3>
          <div className="space-y-2">
            {themes.filter(theme => !theme.isActive).map((theme) => (
              <div key={theme.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">
                  {theme.startDate.toDate().toLocaleDateString('ja-JP', { month: 'long' })}：{theme.title}
                </span>
                <Link
                  href={`/theme/${theme.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  見る
                </Link>
              </div>
            ))}
            {themes.filter(theme => !theme.isActive).length === 0 && (
              <p className="text-gray-500 text-center py-4">過去のテーマはありません</p>
            )}
          </div>
        </div>

        {/* メイン導線 */}
        <div className="text-center mb-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ideas"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              アイデアを見る
            </Link>
            <Link
              href="/post/select"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
            >
              アイデアを投稿する
            </Link>
          </div>
        </div>

        {/* 最新のアイデア（簡素表示） */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">最新のアイデア</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">まだアイデアがありません</p>
              <Link
                href="/post/select"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                最初のアイデアを投稿する
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.slice(0, 5).map((idea) => (
                <Link
                  key={idea.id}
                  href={`/idea/${idea.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="text-lg mr-1">👍</span>
                          <span className="font-semibold">{idea.likes}</span>
                        </span>
                        <span>興味あり人数: 0</span>
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
                        <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
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