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
        
        {/* ヒーローセクション */}
        <section className="relative bg-white py-20 mb-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-5xl font-light text-gray-900 mb-8 tracking-wide">
                Buildea
              </h1>
              <div className="space-y-6">
                <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
                  アイデアをイベントに変えるための場所です。<br />
                  最初の挑戦者を待っています。
                </p>
              </div>
              
              <div className="mt-12">
                <Link
                  href="/post/select"
                  className="inline-flex items-center px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  アイデアを投稿する
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 今月のテーマ */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">今月のテーマ</h2>
            </div>
            
            {activeTheme ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                <div className="text-center">
                  <div className="mb-6">
                    <h3 className="text-xl text-gray-900 mb-4">{activeTheme.title}</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                      {activeTheme.description}
                    </p>
                  </div>
                  
                  <Link
                    href={`/theme/${activeTheme.id}`}
                    className="inline-flex items-center px-6 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    このテーマでアイデアを見る
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  今月のテーマはありません
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 最新のアイデア */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">最新のアイデア</h2>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">読み込み中...</p>
                </div>
              ) : latestIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">まだアイデアがありません</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {latestIdeas.map((idea: Idea) => (
                    <div key={idea.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{idea.title}</h3>
                        <span className="text-sm text-gray-500">
                          {idea.createdAt?.toDate ? new Date(idea.createdAt.toDate()).toLocaleDateString('ja-JP') : ''}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{idea.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>❤️ {idea.likes}</span>
                          <span>👥 {idea.eventFeasibility?.interestedPeople || 0}</span>
                        </div>
                        <Link
                          href={`/ideas/${idea.id}`}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          詳細を見る
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
    </Layout>
  );
}
