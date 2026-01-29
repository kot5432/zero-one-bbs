'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'idea' | 'preparing' | 'event_planned'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [sortBy, setSortBy] = useState<'likes' | 'createdAt'>('likes');
  const { user } = useUserAuth();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasData, activeThemeData, themesData] = await Promise.all([
          getIdeas(),
          getActiveTheme(),
          getThemes()
        ]);
        
        // 検索クエリでフィルタリング
        let filteredIdeas = ideasData;
        if (searchQuery.trim()) {
          filteredIdeas = ideasData.filter(idea => 
            idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            idea.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setIdeas(filteredIdeas);
        setActiveTheme(activeThemeData);
        setThemes(themesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      if (filter === 'all') return idea.status !== 'rejected' && idea.status !== 'completed';
      return idea.status === filter;
    })
    .filter(idea => {
      if (modeFilter === 'all') return true;
      return idea.mode === modeFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return b.likes - a.likes;
      } else {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
    });

  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.title : '不明なテーマ';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-3xl font-bold text-gray-900">ZERO-ONE</Link>
            <nav className="flex space-x-6">
              <Link href="/ideas" className="text-blue-600 font-semibold">
                アイデア一覧
              </Link>
              <Link href="/post/select" className="text-gray-700 hover:text-gray-900">
                投稿
              </Link>
              {user ? (
                <Link href="/user/mypage" className="text-gray-700 hover:text-gray-900">
                  マイページ
                </Link>
              ) : (
                <Link href="/auth/login" className="text-gray-700 hover:text-gray-900">
                  ログイン
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            アイデア一覧
            {searchQuery && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                - 「{searchQuery}」の検索結果
              </span>
            )}
          </h1>
          
          {/* フィルタ */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状態</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">すべて</option>
                  <option value="idea">募集中</option>
                  <option value="preparing">検討中</option>
                  <option value="event_planned">イベント化</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">実施形式</label>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">すべて</option>
                  <option value="online">オンライン</option>
                  <option value="offline">オフライン</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="likes">👍多い順</option>
                  <option value="createdAt">新着順</option>
                </select>
              </div>
            </div>
          </div>

          {/* アイデアカード */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : filteredAndSortedIdeas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">該当するアイデアがありません</p>
              <Link
                href="/post/select"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                アイデアを投稿する
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/idea/${idea.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {idea.themeId && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {getThemeName(idea.themeId)}
                          </span>
                        )}
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
                        <span className="text-xs text-gray-500">
                          {idea.mode === 'online' ? 'オンライン' : 'オフライン'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h3>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="text-lg mr-1">👍</span>
                          <span className="font-semibold">{idea.likes}</span>
                        </span>
                        <span>興味あり人数: 0</span>
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
