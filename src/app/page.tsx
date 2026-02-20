'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserAuth();

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

  // 最新のアイデア（3件）
  const latestIdeas = ideas
    .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
    .slice(0, 3);

  // テーマ名を取得するヘルパー関数
  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.title : '不明なテーマ';
  };

  return (
    <Layout>
        
        {/* ヒーローセクション - 近接の原則 */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-24 mb-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              {/* ブランド情報のグループ化 */}
              <div className="mb-12">
                <div className="inline-flex items-center justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform">
                    <span className="text-white font-bold text-3xl">B</span>
                  </div>
                </div>
                <h1 className="text-8xl font-black text-gray-900 mb-6 tracking-tight leading-none">
                  Buildea
                </h1>
                <div className="space-y-4">
                  <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-tight">
                    あなたのアイデアを、一緒に形に。
                  </p>
                  <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                    投稿から実績化まで、伴走します。
                  </p>
                </div>
              </div>

              {/* 主要アクションのグループ化 - コントラストの原則 */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto">
                <Link
                  href="/ideas"
                  className="group relative flex-1 w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    アイデアを見る
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                <Link
                  href="/post/select"
                  className="group relative flex-1 w-full sm:w-auto px-10 py-5 bg-white text-blue-600 border-3 border-blue-600 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    アイデアを投稿する
                  </span>
                  <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 今月のテーマ - 近接の原則 */}
        <section className="mb-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">今月のテーマ</h2>
              <p className="text-lg text-gray-600">特別テーマでアイデアを投稿しよう</p>
            </div>
            
            {activeTheme ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-10 shadow-sm">
                <div className="text-center">
                  {/* テーマ情報のグループ化 */}
                  <div className="mb-8">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                      募集中
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-6">{activeTheme.title}</h3>
                    <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
                      {activeTheme.description}
                    </p>
                    <div className="flex items-center justify-center gap-6 text-gray-500 mb-10">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">
                          {activeTheme.startDate.toDate().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}〜
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* アクションボタン - 反復の原則 */}
                  <Link
                    href={`/theme/${activeTheme.id}`}
                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    このテーマでアイデアを見る
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">現在テーマ募集中はありません</h3>
                  <p className="text-gray-600 mb-8">自由投稿でアイデアを出してみましょう</p>
                  <Link
                    href="/post/free"
                    className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors shadow-md hover:shadow-lg"
                  >
                    自由投稿でアイデアを出す
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 最新のアイデア - 近接の原則 */}
        <section className="mb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">最新のアイデア</h2>
              <p className="text-lg text-gray-600">コミュニティの最新の創造力を見てみましょう</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">読み込み中...</p>
                </div>
              ) : latestIdeas.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">まだアイデアがありません</h3>
                  <p className="text-gray-600 mb-8">最初のアイデアを投稿してコミュニティを始めましょう</p>
                  <Link
                    href="/post/select"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    最初のアイデアを投稿する
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestIdeas.map((idea, index) => (
                      <Link
                        key={idea.id}
                        href={`/ideas/${idea.id}`}
                        className="block bg-white border border-gray-200 rounded-xl p-6 hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-md"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-bold text-gray-900 truncate flex-1">
                              {idea.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              {/* メタ情報のグループ化 - 反復の原則 */}
                              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg border border-gray-200">
                                <span className="font-semibold text-gray-800">{idea.likes}</span>
                                <span className="text-gray-600 ml-1">いいね</span>
                              </div>
                              <div className={`px-3 py-1 rounded-lg font-medium border ${idea.status === 'idea'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : idea.status === 'preparing'
                                  ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                                  : idea.status === 'event_planned'
                                    ? 'bg-green-50 text-green-800 border-green-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {idea.status === 'idea' ? '募集中' :
                                  idea.status === 'preparing' ? '検討中' :
                                    idea.status === 'event_planned' ? 'イベント化決定' : '見送り'}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 line-clamp-2">{idea.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{idea.createdAt?.toDate ? new Date(idea.createdAt.toDate()).toLocaleDateString('ja-JP') : '日付不明'}</span>
                            <div className="flex items-center gap-1">
                              <span>{idea.themeId ? 'テーマ' : '自由投稿'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* もっと見るボタン - 反復の原則 */}
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="text-center">
                      <Link
                        href="/ideas"
                        className="inline-flex items-center px-6 py-3 bg-white text-blue-700 border border-blue-300 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                      >
                        もっと見る
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
    </Layout>
  );
}
