'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { getIdeas, Idea, getUserNotifications, Notification, getUnreadNotificationCount, markNotificationAsRead } from '@/lib/firestore';

export default function MyPage() {
  const { user, loading, signOut } = useUserAuth();
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
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

  const handleUpdateName = async () => {
    if (!newDisplayName.trim()) {
      setUpdateError('名前を入力してください');
      return;
    }

    setUpdateLoading(true);
    setUpdateError('');

    try {
      // Firebase Authenticationの表示名を更新
      const { updateProfile } = await import('firebase/auth');
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        await updateProfile(currentUser, { displayName: newDisplayName });
      }

      // Firestoreのユーザーデータを更新
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      if (user!.id) {
        const userRef = doc(db, 'users', user!.id);
        await updateDoc(userRef, {
          username: newDisplayName,
          updatedAt: serverTimestamp()
        });
      }

      // 成功メッセージ
      alert('名前を更新しました！');
      setIsEditingName(false);
      setNewDisplayName('');
      
      // ページをリロードして表示を更新
      window.location.reload();
    } catch (error) {
      console.error('Update name error:', error);
      setUpdateError('名前の更新に失敗しました。もう一度お試しください。');
    } finally {
      setUpdateLoading(false);
    }
  };

  const startEditingName = () => {
    setNewDisplayName(user?.username || '');
    setIsEditingName(true);
    setUpdateError('');
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setNewDisplayName('');
    setUpdateError('');
  };

  // 検索機能
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/ideas?search=${encodeURIComponent(query.trim())}`);
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
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  // アイデアの状態を取得
  const getIdeaStatus = (idea: Idea) => {
    switch (idea.status) {
      case 'idea':
        return '募集中';
      case 'checked':
        return '検討中';
      case 'preparing':
        return '準備中';
      case 'event_planned':
        return 'イベント化';
      case 'rejected':
        return '見送り';
      case 'completed':
        return '完了';
      default:
        return '募集中';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '募集中':
        return 'bg-green-100 text-green-800';
      case '検討中':
        return 'bg-yellow-100 text-yellow-800';
      case '準備中':
        return 'bg-orange-100 text-orange-800';
      case 'イベント化':
        return 'bg-blue-100 text-blue-800';
      case '見送り':
        return 'bg-gray-100 text-gray-800';
      case '完了':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ZERO-ONE</h1>
            <nav className="flex items-center space-x-6">
              {/* 検索 */}
              <div className="relative">
                {showSearch ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch(searchQuery);
                          setShowSearch(false);
                        }
                      }}
                      placeholder="アイデアを検索..."
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        handleSearch(searchQuery);
                        setShowSearch(false);
                      }}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      検索
                    </button>
                    <button
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="ml-2 px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="検索"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 通知 */}
              <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors" title="通知">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <Link href="/ideas" className="text-gray-700 hover:text-gray-900">
                アイデア一覧
              </Link>
              <Link href="/user/mypage" className="text-blue-600 font-semibold">
                マイページ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          
          {/* ① プロフィール */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">プロフィール</h2>
              {!isEditingName && (
                <button
                  onClick={startEditingName}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  名前を変更
                </button>
              )}
            </div>
            
            {isEditingName ? (
              <div className="space-y-4">
                {updateError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {updateError}
                  </div>
                )}
                <div>
                  <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">
                    新しい名前
                  </label>
                  <input
                    id="newName"
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="新しい名前を入力"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateName}
                    disabled={updateLoading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {updateLoading ? '更新中...' : '更新'}
                  </button>
                  <button
                    onClick={cancelEditingName}
                    disabled={updateLoading}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">名前：</span>
                  {user.username}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">登録日：</span>
                  {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('ja-JP') : '不明'}
                </p>
              </div>
            )}
          </section>

          {/* ② 自分の投稿一覧 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">自分のアイデア</h2>
            {ideasLoading ? (
              <div className="text-gray-600">読み込み中...</div>
            ) : userIdeas.length === 0 ? (
              <div className="text-gray-600">まだ投稿がありません</div>
            ) : (
              <div className="space-y-3">
                {userIdeas.map((idea) => {
                  const status = getIdeaStatus(idea);
                  return (
                    <div key={idea.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{idea.title}</h3>
                        <p className="text-sm text-gray-600">{idea.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/post/free"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                新しいアイデアを投稿
              </Link>
            </div>
          </section>

          {/* ③ 参加予定イベント */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">参加予定のイベント</h2>
            <div className="text-gray-600">
              現在参加予定のイベントはありません
            </div>
          </section>

          {/* ④ 通知 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">お知らせ</h2>
            <div className="text-gray-600">
              現在お知らせはありません
            </div>
          </section>

          {/* ⑤ 設定 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">設定</h2>
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ログアウト
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ZERO-ONE</h3>
              <p className="text-gray-300">
                アイデアを、0から1にする掲示板
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
                  <Link href="/user/mypage" className="text-gray-300 hover:text-white">
                    マイページ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white">
                    ZERO-ONEについて
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2026 ZERO-ONE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
