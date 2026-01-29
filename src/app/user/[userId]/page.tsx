'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { getUser, getUserIdeas, User, Idea, getThemes, Theme } from '@/lib/firestore';

export default function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, ideasData, themesData] = await Promise.all([
          getUser(resolvedParams.userId),
          getUserIdeas(resolvedParams.userId),
          getThemes()
        ]);
        
        setUser(userData);
        setUserIdeas(ideasData);
        setThemes(themesData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.userId]);

  // テーマ名を取得するヘルパー関数
  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.title : '不明なテーマ';
  };

  // テーマ別に投稿をグループ化
  const ideasByTheme = userIdeas.reduce((acc, idea) => {
    if (idea.themeId) {
      const themeName = getThemeName(idea.themeId);
      if (!acc[themeName]) {
        acc[themeName] = [];
      }
      acc[themeName].push(idea);
    } else {
      if (!acc['自由投稿']) {
        acc['自由投稿'] = [];
      }
      acc['自由投稿'].push(idea);
    }
    return acc;
  }, {} as Record<string, Idea[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ユーザーが見つかりません</p>
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
            <h1 className="text-3xl font-bold text-gray-900">ZERO-ONE</h1>
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
              <Link href={`/user/${resolvedParams.userId}`} className="text-blue-600 font-semibold">
                マイページ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* マイページ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">マイページ</h2>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{user.username}</h3>
            <p className="text-gray-600">登録日: {user.createdAt.toDate().toLocaleDateString('ja-JP')}</p>
          </div>
          
          {/* 自分の投稿 */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">【自分の投稿】</h4>
            <div className="space-y-3">
              {userIdeas.map((idea) => (
                <div key={idea.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-lg font-semibold text-gray-900">
                      {idea.title}
                    </h5>
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
                  </div>
                  
                  <p className="text-gray-600 mb-2 line-clamp-2">
                    {idea.description}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>👍 {idea.likes}</span>
                    <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
              
              {userIdeas.length === 0 && (
                <p className="text-gray-500 text-center py-4">まだ投稿がありません</p>
              )}
            </div>
          </div>
          
          {/* 参加意思 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">【参加意思】</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-center">
                参加意思を示したアイデアはここに表示されます
              </p>
              <p className="text-gray-500 text-sm text-center mt-2">
                （現在開発中です）
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
