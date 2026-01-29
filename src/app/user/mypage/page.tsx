'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { getIdeas, Idea } from '@/lib/firestore';
import Header from '@/components/Header';

export default function MyPage() {
  const { user, loading, signOut } = useUserAuth();
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const fetchUserIdeas = async () => {
        try {
          const allIdeas = await getIdeas();
          const myIdeas = allIdeas.filter(idea => idea.userId === user.id);
          setUserIdeas(myIdeas);
        } catch (error) {
          console.error('Error fetching user ideas:', error);
        } finally {
          setIdeasLoading(false);
        }
      };

      fetchUserIdeas();
    }
  }, [user]);

  const handleSignOut = async () => {
    if (confirm('本当にログアウトしますか？')) {
      try {
        await signOut();
        router.push('/');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  const getIdeaStatus = (idea: Idea) => {
    switch (idea.status) {
      case 'idea':
        return '募集中';
      case 'checked':
        return '確認済み';
      case 'preparing':
        return '検討中';
      case 'event_planned':
        return 'イベント化決定';
      case 'rejected':
        return '見送り';
      case 'completed':
        return '完了';
      default:
        return idea.status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">マイページ</h1>
          <p className="text-gray-600">{user.displayName || user.email} さん</p>
        </div>

        {/* 自分の投稿 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">自分の投稿</h2>
          
          {ideasLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : userIdeas.length === 0 ? (
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
            <div className="space-y-4">
              {userIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h3>
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
                          {getIdeaStatus(idea)}
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
        </div>

        {/* 設定 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">設定</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">メールアドレス</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">表示名</p>
                <p className="text-sm text-gray-600">{user.displayName || '未設定'}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <button
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ZERO-ONE</h3>
              <p className="text-gray-300">
                ZERO-ONE
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">サービス</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/ideas" className="text-gray-300 hover:text-white">
                    アイデア一覧
                  </Link>
                </li>
                <li>
                  <Link href="/post/select" className="text-gray-300 hover:text-white">
                    投稿する
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">サポート</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-gray-300 hover:text-white">
                    ログイン
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-gray-300 hover:text-white">
                    アカウント作成
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400">
              &copy; 2024 ZERO-ONE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
