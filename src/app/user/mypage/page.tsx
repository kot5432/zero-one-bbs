'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getIdeas, Idea, getUserLikedIdeas, getUserIp } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Header from '@/components/Header';

export default function MyPage() {
  const { user, signOut } = useUserAuth();
  const router = useRouter();
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [likedIdeas, setLikedIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [likedLoading, setLikedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-ideas' | 'liked'>('my-ideas');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // 自分の投稿を取得
        const allIdeas = await getIdeas();
        const userIdeas = allIdeas.filter(idea => idea.createdBy === user.uid || idea.userId === user.uid);
        setMyIdeas(userIdeas.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
        
        // 共感した投稿を取得
        const userIp = getUserIp();
        const liked = await getUserLikedIdeas(userIp);
        setLikedIdeas(liked.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIdeasLoading(false);
        setLikedLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'idea':
        return '募集中';
      case 'preparing':
        return '検討中';
      case 'event_planned':
        return 'イベント化決定';
      case 'rejected':
        return '見送り';
      case 'completed':
        return '完了';
      default:
        return '不明';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea':
        return 'bg-gray-100 text-gray-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'event_planned':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* プロフィール表示 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.displayName || 'ユーザー'}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/user/profile/edit')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              プロフィール編集
            </button>
          </div>
        </div>

        {/* アイデア投稿への導線 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center">
            <Link
              href="/post/select"
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
            >
              アイデアを投稿する
            </Link>
            <p className="text-gray-600 mt-2">新しいアイデアでみんなを驚かせよう！</p>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('my-ideas')}
                className={`flex-1 px-6 py-4 text-center font-medium ${
                  activeTab === 'my-ideas'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                自分のアイデア ({myIdeas.length})
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`flex-1 px-6 py-4 text-center font-medium ${
                  activeTab === 'liked'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                共感した投稿 ({likedIdeas.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'my-ideas' ? (
              ideasLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : myIdeas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">まだアイデアを投稿していません</p>
                  <Link
                    href="/post/select"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    最初のアイデアを投稿する
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myIdeas.map((idea) => (
                    <div key={idea.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          <Link href={`/ideas/${idea.id}`} className="hover:text-blue-600">
                            {idea.title}
                          </Link>
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(idea.status)}`}>
                          {getStatusLabel(idea.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <span className="mr-1">👍</span>
                            <span>{idea.likes}</span>
                          </span>
                          <Link
                            href={`/post/edit/${idea.id}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            編集
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              likedLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : likedIdeas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">まだ共感した投稿がありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {likedIdeas.map((idea) => (
                    <div key={idea.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          <Link href={`/ideas/${idea.id}`} className="hover:text-blue-600">
                            {idea.title}
                          </Link>
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(idea.status)}`}>
                          {getStatusLabel(idea.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                        <span className="flex items-center">
                          <span className="mr-1">👍</span>
                          <span>{idea.likes}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* 設定・ログアウト */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">設定</h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-red-600 hover:text-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
