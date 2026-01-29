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
        {/* プロフィールセクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
              <p className="text-gray-600 mt-1">登録日: {user.createdAt.toDate().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-900">{user.postCount}</p>
              <p className="text-sm text-blue-600">投稿数</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">{user.themeCount}</p>
              <p className="text-sm text-green-600">参加テーマ数</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-900">
                {userIdeas.reduce((sum, idea) => sum + idea.likes, 0)}
              </p>
              <p className="text-sm text-purple-600">総👍数</p>
            </div>
          </div>
        </div>

        {/* 自分の投稿一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">自分の投稿</h3>
          
          {Object.keys(ideasByTheme).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">まだ投稿がありません</p>
              <Link
                href="/post/select"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                最初のアイデアを投稿する
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(ideasByTheme).map(([themeName, ideas]) => (
                <div key={themeName}>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    {themeName === '自由投稿' ? (
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {themeName}
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {themeName}
                      </span>
                    )}
                    <span className="ml-2 text-sm text-gray-500">
                      {ideas.length}件
                    </span>
                  </h4>
                  
                  <div className="grid gap-4">
                    {ideas.map((idea) => (
                      <div key={idea.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {idea.title}
                          </h5>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              idea.status === 'idea'
                                ? 'bg-yellow-100 text-yellow-800'
                                : idea.status === 'preparing'
                                ? 'bg-blue-100 text-blue-800'
                                : idea.status === 'event_planned'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {idea.status === 'idea' ? '未確認' : 
                             idea.status === 'preparing' ? '検討中' :
                             idea.status === 'event_planned' ? 'イベント化予定' : 'その他'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {idea.description}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>👍 {idea.likes}</span>
                            <span>{idea.mode === 'online' ? 'オンライン' : 'オフライン'}</span>
                          </div>
                          <span>
                            {idea.createdAt.toDate().toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Link
                            href={`/idea/${idea.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            詳細を見る
                          </Link>
                          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                            編集
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
