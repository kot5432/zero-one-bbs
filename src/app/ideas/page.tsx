'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Layout from '@/components/Layout';

function IdeasPageContent() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'idea' | 'preparing' | 'event_planned' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'likes' | 'createdAt'>('createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUserAuth();
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('search') || '';

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

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

  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      if (filter === 'all') return idea.status !== 'rejected' && idea.status !== 'completed';
      return idea.status === filter;
    })
    .filter(idea => {
      if (searchQuery) {
        return idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               idea.description.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return b.likes - a.likes;
      } else {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      }
    });

  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.title : '不明なテーマ';
  };

  return (
    <Layout>
        {/* ヘッダーセクション */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                アイデア一覧
                {searchQuery && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    - 「{searchQuery}」の検索結果
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                コミュニティの創造的なアイデアを発見しましょう
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link
                href="/post/select"
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                アイデアを投稿
              </Link>
            </div>
          </div>
        </div>

        {/* フィルターセクション */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="アイデアを検索..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="idea">募集中</option>
                <option value="preparing">検討中</option>
                <option value="event_planned">イベント化決定</option>
                <option value="rejected">見送り</option>
              </select>
            </div>
            
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">新着順</option>
                <option value="likes">人気順</option>
              </select>
            </div>
          </div>
          
          {/* 検索結果数 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{filteredAndSortedIdeas.length}</span>
              <span className="text-gray-600 ml-1">件のアイデアが見つかりました</span>
            </p>
          </div>
        </div>

        {/* アイデアカード */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : filteredAndSortedIdeas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-8">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.355.623a2.004 2.004 0 01-2.552 1.636l-6.364 6.364a2.004 2.004 0 01-2.552-1.636L6.364 4.636A2.004 2.004 0 018.918 6.272L12 9.545l3.082 3.273a2.004 2.004 0 012.552-1.636l-6.364-6.364z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">アイデアが見つかりません</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              検索条件を変えてみたり、新しいアイデアを投稿してみましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
              >
                フィルターをリセット
              </button>
              <Link
                href="/post/select"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                アイデアを投稿する
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedIdeas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-xl transition-all hover:-translate-y-1 block"
              >
                {/* ヘッダー情報 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        idea.status === 'idea'
                          ? 'bg-gray-100 text-gray-800'
                          : idea.status === 'preparing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : idea.status === 'event_planned'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                      }`}>
                        {idea.status === 'idea' ? '募集中' : 
                         idea.status === 'preparing' ? '検討中' : 
                         idea.status === 'event_planned' ? 'イベント化決定' : '見送り'}
                      </span>
                      {idea.themeId ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          テーマ投稿
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          自由投稿
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* メタ情報 */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {idea.createdAt.toDate().toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex items-center font-semibold text-gray-800">
                    <span className="mr-1">{idea.likes}</span>
                    <span className="text-gray-600 font-normal">いいね</span>
                  </div>
                </div>
                
                {/* フッター情報 */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      投稿者: {idea.createdBy || '匿名'}
                    </div>
                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                      詳細を見る
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Layout>
  );
}

export default function IdeasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">読み込み中...</p></div>}>
      <IdeasPageContent />
    </Suspense>
  );
}
