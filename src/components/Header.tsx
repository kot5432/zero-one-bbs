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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-8 py-3">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-gray-900"
          >
            ZERO-ONE
          </Link>

          {/* ナィゲーション */}
          <nav className="flex items-center space-x-8">
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
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      handleSearch(searchQuery);
                      setShowSearch(false);
                    }}
                    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    検索
                  </button>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                    className="ml-2 px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-3 text-gray-600 hover:text-gray-800 transition-colors"
                  title="検索"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="relative p-3 text-gray-600 hover:text-gray-800 transition-colors" 
                    title="通知"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
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

              {/* ナビゲーションリンク */}
            <Link 
              href="/ideas" 
              className="font-medium py-2 text-gray-700 hover:bg-gray-100"
            >
              アイデア一覧
            </Link>
            <Link 
              href="/post/select" 
              className="font-medium py-2 ml-4 text-gray-700 hover:bg-gray-100"
            >
              投稿する
            </Link>
            <Link 
              href="/contact" 
              className="font-medium py-2 ml-4 text-blue-600 hover:bg-blue-50"
            >
              お問い合わせ
            </Link>

            {/* ユーザー関連 */}
            {user ? (
              <Link 
                href="/user/mypage" 
                className="font-medium py-2 ml-4 text-gray-700 hover:bg-gray-100"
              >
                マイページ
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-medium py-2 ml-4 text-blue-600 hover:bg-blue-50"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="font-medium py-2 ml-4 text-gray-700 hover:bg-gray-100"
                >
                  アカウント作成
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
