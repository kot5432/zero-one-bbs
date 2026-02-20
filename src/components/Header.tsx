'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { getUserNotifications, Notification, getUnreadNotificationCount, markNotificationAsRead } from '@/lib/firestore';

export default function Header() {
  const { user } = useUserAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 通知データ取得
  useEffect(() => {
    if (user && user.uid) {
      const fetchNotifications = async () => {
        try {
          const [notificationsData, unreadData] = await Promise.all([
            getUserNotifications(user.uid),
            getUnreadNotificationCount(user.uid)
          ]);
          setNotifications(notificationsData);
          setUnreadCount(unreadData);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotifications();
    }
  }, [user]);

  // 通知アイコンを取得するヘルパー関数
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/ideas?search=${encodeURIComponent(query.trim())}`);
    }
  };

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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900"
          >
            Buildea
          </Link>

          {/* ナビゲーション */}
          <nav className="flex items-center space-x-6">
            {/* 検索 */}
            <div className="relative">
              {showSearch ? (
                <div className="absolute top-0 right-0 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        handleSearch(searchQuery);
                        setShowSearch(false);
                      }}
                      className="ml-3 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      検索
                    </button>
                    <button
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>
                  {/* 検索候補 */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">人気の検索キーワード</h4>
                    <div className="flex flex-wrap gap-2">
                      {['アイデア投稿', 'イベント企画', 'テーマ提案', '技術相談'].map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => {
                            setSearchQuery(keyword);
                            handleSearch(keyword);
                            setShowSearch(false);
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
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
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                  title="通知"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
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
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
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

            {/* ナビゲーションリンク - 直感的な設計 */}
            <div className="flex items-center space-x-2">
              {/* 主要ナビゲーション */}
              <Link
                href="/ideas"
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-semibold"
              >
                📋 アイデア一覧
              </Link>
              <Link
                href="/post/select"
                className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all font-semibold"
              >
                ✏️ 投稿する
              </Link>
              
              {/* セパレーター */}
              <div className="border-l border-gray-300 h-6 mx-3"></div>
              
              {/* サポートナビゲーション */}
              <div className="relative group">
                <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium flex items-center">
                  サポート
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link
                    href="/contact"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    📧 技術的なお問い合わせ
                  </Link>
                  <Link
                    href="/business-contact"
                    className="block px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    💼 ビジネスに関するお問い合わせ
                  </Link>
                  <Link
                    href="/about"
                    className="block px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    ℹ️ Buildeaについて
                  </Link>
                </div>
              </div>
            </div>

            {/* ユーザー関連 */}
            {user ? (
              <div className="relative group">
                <button className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center">
                  マイページ
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-4">
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">U</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">ユーザー</h4>
                        <p className="text-sm text-gray-500">マイページ</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <Link href="/user/mypage" className="block px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center">
                        <span className="text-lg mr-3">👤</span>
                        <div>
                          <div className="font-medium">プロフィール</div>
                          <div className="text-xs text-gray-500">基本情報の設定</div>
                        </div>
                      </Link>
                      <Link href="/ideas" className="block px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center">
                        <span className="text-lg mr-3">📋</span>
                        <div>
                          <div className="font-medium">投稿したアイデア</div>
                          <div className="text-xs text-gray-500">自分の投稿一覧</div>
                        </div>
                      </Link>
                      <Link href="/ideas" className="block px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center">
                        <span className="text-lg mr-3">👍</span>
                        <div>
                          <div className="font-medium">共感したアイデア</div>
                          <div className="text-xs text-gray-500">いいねした投稿</div>
                        </div>
                      </Link>
                      <Link href="/user/mypage" className="block px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center">
                        <span className="text-lg mr-3">⚙️</span>
                        <div>
                          <div className="font-medium">設定</div>
                          <div className="text-xs text-gray-500">アカウント設定</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  アカウント作成
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
