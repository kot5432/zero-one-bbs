'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getIdeas, Idea, getActiveTheme, Theme, getThemes, getUserNotifications, Notification, getUnreadNotificationCount, markNotificationAsRead } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useUserAuth();
  const router = useRouter();

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

  // 通知データ取得
  useEffect(() => {
    if (user && user.id) {
      const fetchNotifications = async () => {
        try {
          const [notificationsData, unreadData] = await Promise.all([
            getUserNotifications(user.id),
            getUnreadNotificationCount(user.id)
          ]);
          setNotifications(notificationsData);
          setUnreadCount(unreadData);

          // サンプル通知を作成（初回のみ）
          if (notificationsData.length === 0) {
            const { createNotification } = await import('@/lib/firestore');
            await createNotification({
              userId: user.id,
              title: 'ようこそZERO-ONEへ！',
              message: 'アイデアを投稿して、0から1を創造しましょう！',
              type: 'system',
              isRead: false,
              link: '/ideas'
            });
            
            // 再取得
            const [newNotifications, newUnread] = await Promise.all([
              getUserNotifications(user.id),
              getUnreadNotificationCount(user.id)
            ]);
            setNotifications(newNotifications);
            setUnreadCount(newUnread);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotifications();
    }
  }, [user]);

  // 通知処理関数
  const handleNotificationClick = async (notification: Notification) => {
    // 既読にする
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // リンクがあれば遷移
    if (notification.link) {
      router.push(notification.link);
    }
    
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '🎉';
      case 'comment':
        return '💬';
      case 'participation':
        return '✅';
      default:
        return '📢';
    }
  };

  // 検索機能
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/ideas?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSignOut = async () => {
    if (confirm('本当にログアウトしますか？')) {
      try {
        await signOut();
        // トップページにいるのでリロードして状態を更新
        window.location.reload();
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  // テーマ名を取得するヘルパー関数
  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.title : '不明なテーマ';
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

              {/* 通知（ログイン時のみ） */}
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors" 
                    title="通知"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {/* 通知ドロップダウン */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">通知</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-gray-500 text-center">
                            通知がありません
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                                <div className="flex-1">
                                  <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {notification.createdAt?.toDate?.() ? 
                                      new Date(notification.createdAt.toDate()).toLocaleDateString('ja-JP') : 
                                      '不明'
                                    }
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Link href="/ideas" className="text-gray-700 hover:text-gray-900">
                アイデア一覧
              </Link>
              {user ? (
                <Link href="/user/mypage" className="text-gray-700 hover:text-gray-900">
                  マイページ
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-700 hover:text-gray-900">
                    ログイン
                  </Link>
                  <Link href="/auth/signup" className="text-gray-700 hover:text-gray-900">
                    アカウント作成
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* サービス説明 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">ZERO-ONE</h1>
          <p className="text-2xl text-gray-600 mb-8">アイデアを、0から1にする掲示板</p>
        </div>

        {/* 今月のテーマ */}
        {activeTheme && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-16">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">【今月のテーマ】</p>
              <h2 className="text-3xl font-bold mb-4">{activeTheme.title}</h2>
              <div className="text-lg mb-6 opacity-90">
                {activeTheme.description}
              </div>
              <div className="flex justify-center items-center gap-6 text-sm mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full">
                  期限: {activeTheme.endDate.toDate().toLocaleDateString('ja-JP')}
                </span>
              </div>
              <Link
                href={`/theme/${activeTheme.id}`}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-lg"
              >
                このテーマで考える
              </Link>
            </div>
          </div>
        )}

        {/* 過去のテーマ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-16">
          <h3 className="text-xl font-bold text-gray-900 mb-4">【過去のテーマ】</h3>
          <div className="space-y-2">
            {themes.filter(theme => !theme.isActive).map((theme) => (
              <div key={theme.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">
                  {theme.startDate.toDate().toLocaleDateString('ja-JP', { month: 'long' })}：{theme.title}
                </span>
                <Link
                  href={`/theme/${theme.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  見る
                </Link>
              </div>
            ))}
            {themes.filter(theme => !theme.isActive).length === 0 && (
              <p className="text-gray-500 text-center py-4">過去のテーマはありません</p>
            )}
          </div>
        </div>

        {/* メイン導線 */}
        <div className="text-center mb-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ideas"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              アイデアを見る
            </Link>
            <Link
              href="/post/select"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
            >
              アイデアを投稿する
            </Link>
          </div>
        </div>

        {/* 最新のアイデア（簡素表示） */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">最新のアイデア</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
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
              {ideas.slice(0, 5).map((idea) => (
                <Link
                  key={idea.id}
                  href={`/idea/${idea.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="text-lg mr-1">👍</span>
                          <span className="font-semibold">{idea.likes}</span>
                        </span>
                        <span>興味あり人数: 0</span>
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
                        <span>{idea.mode === 'online' ? 'オンライン' : 'オフライン'}</span>
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
                  <Link href="/auth/login" className="text-gray-300 hover:text-white">
                    ログイン
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-gray-300 hover:text-white">
                    アカウント作成
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