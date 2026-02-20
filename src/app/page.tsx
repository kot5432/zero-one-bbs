'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Header from '@/components/Header';
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
    <div className="min-h-screen bg-white">
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        
        {/* ヒーローセクション - 近接の原則 */}
        <section className="text-center mb-24">
          <div className="max-w-4xl mx-auto">
            {/* ブランド情報のグループ化 */}
            <div className="mb-12">
              <h1 className="text-7xl font-bold text-gray-900 mb-6 tracking-tight">
                Buildea
              </h1>
              <div className="space-y-4">
                <p className="text-3xl text-gray-800 font-medium">
                  あなたのアイデアを、一緒に形に。
                </p>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                  投稿から実績化まで、伴走します。
                </p>
              </div>
            </div>

            {/* 主要アクションのグループ化 - コントラストの原則 */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-lg mx-auto">
              <Link
                href="/ideas"
                className="flex-1 w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                📋 アイデアを見る
              </Link>
              <Link
                href="/post/select"
                className="flex-1 w-full sm:w-auto px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                ✏️ アイデアを投稿する
              </Link>
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
                      🎯 募集中
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
                  <div className="divide-y divide-gray-100">
                    {latestIdeas.map((idea, index) => (
                      <Link
                        key={idea.id}
                        href={`/ideas/${idea.id}`}
                        className={`block p-8 hover:bg-gray-50 transition-colors ${index === 0 ? 'border-t-0' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* アイデア情報のグループ化 */}
                            <div className="mb-4">
                              <h3 className="text-2xl font-bold text-gray-900 mb-3 truncate">
                                {idea.title}
                              </h3>
                              <div className="flex items-center gap-6 text-sm">
                                {/* メタ情報のグループ化 - 反復の原則 */}
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                                    <span className="text-base">👍</span>
                                    <span className="font-semibold text-gray-700">{idea.likes}</span>
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg font-medium ${idea.status === 'idea'
                                    ? 'bg-gray-100 text-gray-700'
                                    : idea.status === 'preparing'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : idea.status === 'event_planned'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    {idea.status === 'idea' ? '募集中' :
                                      idea.status === 'preparing' ? '検討中' :
                                        idea.status === 'event_planned' ? 'イベント化決定' : '見送り'}
                                  </div>
                                  <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                    {idea.themeId ? '📋 テーマ' : '✨ 自由投稿'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-6 flex-shrink-0">
                            <div className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                              {idea.createdAt.toDate().toLocaleDateString('ja-JP')}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* もっと見るボタン - 反復の原則 */}
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="text-center">
                      <Link
                        href="/ideas"
                        className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-xl font-medium hover:bg-blue-50 transition-colors"
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

        {/* 行動喚起セクション - コントラストの原則 */}
        <section className="mb-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-4">準備はできましたか？</h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                あなたの創造的なアイデアで、世界を変えましょう。今すぐ投稿して、コミュニティと繋がりましょう。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/post/select"
                  className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ✨ アイデアを投稿する
                </Link>
                <Link
                  href="/ideas"
                  className="inline-flex items-center px-8 py-4 bg-blue-700 text-white rounded-xl font-semibold text-lg hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  📋 アイデアを見る
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* ブランドセクション */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <h3 className="text-2xl font-bold">
                  Buildea
                </h3>
              </div>
              <p className="text-gray-300 text-base leading-relaxed">
                創造的なアイデアを形にするプラットフォーム
              </p>
              <div className="flex space-x-3">
                <a
                  href="https://twitter.com/kto_543"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* サービスセクション */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">サービス</h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link href="/ideas" className="text-gray-300 hover:text-white transition-colors">
                    アイデア一覧
                  </Link>
                </li>
                <li>
                  <Link href="/post/select" className="text-gray-300 hover:text-white transition-colors">
                    投稿する
                  </Link>
                </li>
              </ul>
            </div>

            {/* サポートセクション */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">サポート</h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                    ログイン
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-gray-300 hover:text-white transition-colors">
                    アカウント作成
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                    Buildeaについて
                  </Link>
                </li>
              </ul>
            </div>

            {/* お問い合わせセクション */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
              <p className="text-gray-300 text-base mb-6">
                ご質問やご要望がございましたら、お気軽にお問い合わせください。
              </p>
              <div className="space-y-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors w-full justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  技術的なお問い合わせ
                </Link>
                <Link
                  href="/business-contact"
                  className="inline-flex items-center px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors w-full justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  ビジネスに関するお問い合わせ
                </Link>
              </div>
            </div>
          </div>

          {/* コピーライトセクション */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-base">
                &copy; 2024 Buildea. All rights reserved.
              </p>
              <div className="flex space-x-8 text-base">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  利用規約
                </Link>
                <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors">
                  サイトマップ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
