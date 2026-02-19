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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* ファーストビュー */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* ヒき */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ZERO-ONE
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            コミュニティのアイデアを形にするプラットフォーム
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            地域の課題解決や新しい企画を、みんなの力で0から1へ
          </p>
        </div>

        {/* 今月のテーマ */}
        {activeTheme ? (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-16 shadow-xl">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">【今月のテーマ】</p>
              <h2 className="text-4xl font-bold mb-4">{activeTheme.title}</h2>
              <div className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">
                {activeTheme.description}
              </div>
              <div className="flex justify-center items-center gap-6 text-sm mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full">
                  {activeTheme.startDate.toDate().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}〜
                </span>
                <span className="bg-white/20 px-4 py-2 rounded-full">
                  募集中
                </span>
              </div>
              <Link
                href={`/theme/${activeTheme.id}`}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-lg shadow-lg"
              >
                このテーマでアイデアを見る
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 mb-16 text-center shadow-lg">
            <p className="text-xl text-gray-600 mb-4">現在テーマ募集中はありません</p>
            <Link
              href="/post/free"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              自由投稿でアイデアを出す
            </Link>
          </div>
        )}

        {/* メイン行動 */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">さあ、始めましょう</h3>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/ideas"
              className="bg-blue-600 text-white px-12 py-6 rounded-lg font-semibold text-xl hover:bg-blue-700 transition-colors shadow-xl"
            >
              📋 アイデアを見る
            </Link>
            <Link
              href="/post/select"
              className="bg-green-600 text-white px-12 py-6 rounded-lg font-semibold text-xl hover:bg-green-700 transition-colors shadow-xl"
            >
              ✏️ アイデアを投稿する
            </Link>
          </div>
        </div>

        {/* 最新のアイデア（軽量表示） */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">最新のアイデア</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : latestIdeas.length === 0 ? (
            <div className="text-center py-12">
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
              {latestIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors p-6 block"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="text-lg mr-1">👍</span>
                          <span className="font-semibold">{idea.likes}</span>
                        </span>
                        <span className="flex items-center">
                          <span className="text-lg mr-1">👥</span>
                          <span className="font-semibold">0</span>
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            idea.status === 'idea'
                              ? 'bg-gray-100 text-gray-800'
                              : idea.status === 'preparing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : idea.status === 'event_planned'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {idea.status === 'idea' ? '募集中' : 
                           idea.status === 'preparing' ? '検討中' : 
                           idea.status === 'event_planned' ? 'イベント化決定' : '見送り'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {idea.themeId ? `テーマ` : '自由投稿'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {idea.createdAt.toDate().toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link
              href="/ideas"
              className="text-blue-600 hover:text-blue-700 font-semibold text-lg"
            >
              もっと見る →
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-100 text-gray-700 mt-16 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ブランド */}
            <div>
              <h3 className="text-lg font-semibold mb-4">ZERO-ONE</h3>
              <p className="text-sm text-gray-600">
                創造的なアイデアを形にするプラットフォーム
              </p>
            </div>

            {/* リンク */}
            <div>
              <h3 className="text-lg font-semibold mb-4">リンク</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/ideas" className="text-gray-600 hover:text-gray-900">
                    アイデア一覧
                  </Link>
                </li>
                <li>
                  <Link href="/post/select" className="text-gray-600 hover:text-gray-900">
                    投稿する
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link href="/business-contact" className="text-gray-600 hover:text-gray-900">
                    ビジネス関連
                  </Link>
                </li>
              </ul>
            </div>

            {/* SNS */}
            <div>
              <h3 className="text-lg font-semibold mb-4">SNS</h3>
              <a 
                href="https://twitter.com/kto_543" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                X (Twitter) @kto_543
              </a>
            </div>
          </div>

          {/* コピーライト */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>&copy; 2024 ZERO-ONE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}