'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getIdeas, Idea, getUserLikedIdeas, getUserIp } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Layout from '@/components/Layout';

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

  const handleLogout = async () => {
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
      <Layout>
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
        {/* プロフィール表示 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
                <span className="text-white text-2xl font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.displayName || 'ユーザー'}
                </h1>
                <p className="text-gray-600 text-lg">{user.email}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="text-sm">
                    <span className="font-semibold text-blue-600">{myIdeas.length}</span>
                    <span className="text-gray-600 ml-1">投稿</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-green-600">{likedIdeas.length}</span>
                    <span className="text-gray-600 ml-1">共感</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/user/profile/edit')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              プロフィール編集
            </button>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">クイックアクション</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/post/select"
              className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              アイデアを投稿
            </Link>
            
            <Link
              href="/ideas"
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              アイデアを見る
            </Link>
            
            <Link
              href="/about"
              className="flex-1 flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Buildeaについて
            </Link>
          </div>
        </div>

        {/* アクティビティタブ */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('my-ideas')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'my-ideas'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>自分のアイデア</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                    {myIdeas.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'liked'
                    ? 'text-green-600 bg-white border-b-2 border-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>共感したアイデア</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                    {likedIdeas.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'my-ideas' && (
              <div className="space-y-4">
                {myIdeas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">まだアイデアを投稿していません</p>
                    <Link
                      href="/post/select"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      最初のアイデアを投稿する
                    </Link>
                  </div>
                ) : (
                  myIdeas.map((idea) => (
                    <div key={idea.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
                          {getStatusLabel(idea.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{idea.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                            {idea.likes}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {idea.eventFeasibility?.interestedPeople || 0}
                          </span>
                          <span>
                            {idea.createdAt?.toDate ? new Date(idea.createdAt.toDate()).toLocaleDateString('ja-JP') : '日付不明'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/ideas/${idea.id}`}
                            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                          >
                            詳細を見る
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'liked' && (
              <div className="space-y-4">
                {likedIdeas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">まだ共感したアイデアがありません</p>
                    <Link
                      href="/ideas"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      アイデアを見る
                    </Link>
                  </div>
                ) : (
                  likedIdeas.map((idea) => (
                    <div key={idea.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
                          {getStatusLabel(idea.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{idea.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                            {idea.likes}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {idea.eventFeasibility?.interestedPeople || 0}
                          </span>
                          <span>
                            {idea.createdAt?.toDate ? new Date(idea.createdAt.toDate()).toLocaleDateString('ja-JP') : '日付不明'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/ideas/${idea.id}`}
                            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                          >
                            詳細を見る
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* アカウント設定 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">アカウント設定</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/user/profile/edit')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-gray-900">プロフィール編集</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium text-red-600">ログアウト</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </Layout>
  );
}
