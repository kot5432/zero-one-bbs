'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Header from '@/components/Header';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'idea' | 'preparing' | 'event_planned' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'likes' | 'createdAt'>('createdAt');
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
      <Header />
      
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
          
          {/* フィルター */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">テーマ:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">すべて</option>
                  <option value="idea">募集中</option>
                  <option value="preparing">検討中</option>
                  <option value="event_planned">イベント化決定</option>
                  <option value="rejected">見送り</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">並び順:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="createdAt">新着順</option>
                  <option value="likes">👍多い順</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 block"
                >
                  {/* タイトル（最重要） */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {idea.title}
                  </h3>
                  
                  {/* テーマタグ */}
                  <div className="mb-2">
                    {idea.themeId ? (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {getThemeName(idea.themeId)}
                      </span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        自由投稿
                      </span>
                    )}
                  </div>
                  
                  {/* 反応（いいね・参加意思） */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center">
                      <span className="text-lg mr-1">👍</span>
                      <span className="font-semibold">{idea.likes}</span>
                    </span>
                    <span className="flex items-center">
                      <span className="text-lg mr-1">👥</span>
                      <span className="font-semibold">0</span>
                    </span>
                  </div>
                  
                  {/* 状態 */}
                  <div className="flex justify-between items-center">
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
                      {idea.createdAt.toDate().toLocaleDateString('ja-JP')}
                    </span>
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
