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

  // 状態に応じた色を返す
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea': return 'bg-yellow-100 text-yellow-800';
      case 'checked': return 'bg-gray-100 text-gray-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'event_planned': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 状態の日本語表示
  const getStatusText = (status: string) => {
    switch (status) {
      case 'idea': return '募集中';
      case 'checked': return '確認済み';
      case 'preparing': return '検討中';
      case 'event_planned': return 'イベント化';
      case 'rejected': return '見送り';
      default: return '不明';
    }
  };

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
        <p className="text-gray-600">ユーザーが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← トップに戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* プロフィール */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 プロフィール</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">名前：</span>
              {user.username}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">登録日：</span>
              {user.createdAt.toDate().toLocaleDateString('ja-JP')}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">投稿数：</span>
              {userIdeas.length}
            </p>
          </div>
        </section>

        {/* 自分のアイデア */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 自分のアイデア</h2>
          {userIdeas.length > 0 ? (
            <div className="space-y-3">
              {userIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Link 
                      href={`/idea/${idea.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {idea.title}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1">
                      👍 {idea.likes} · {idea.createdAt.toDate().toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(idea.status)}`}>
                    {getStatusText(idea.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">まだアイデアを投稿していません</p>
          )}
        </section>

        {/* 参加イベント */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 参加イベント</h2>
          <p className="text-gray-500">現在参加中のイベントはありません</p>
        </section>

        {/* お知らせ */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔔 お知らせ</h2>
          <div className="space-y-2">
            {userIdeas.filter(idea => idea.status === 'preparing').length > 0 && (
              <p className="text-blue-600">
                あなたのアイデアが検討中になりました
              </p>
            )}
            {userIdeas.filter(idea => idea.status === 'event_planned').length > 0 && (
              <p className="text-green-600">
                あなたのアイデアがイベント化されました
              </p>
            )}
            {userIdeas.filter(idea => idea.status === 'preparing').length === 0 && 
             userIdeas.filter(idea => idea.status === 'event_planned').length === 0 && (
              <p className="text-gray-500">新しいお知らせはありません</p>
            )}
          </div>
        </section>

        {/* 設定 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 設定</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-gray-700">名前変更</span>
            </button>
            <Link 
              href="/settings/delete-account"
              className="w-full text-left px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors block text-red-600"
            >
              アカウントを削除する
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
