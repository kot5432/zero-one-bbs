'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getIdeas, Idea } from '@/lib/firestore';
import { updateIdeaStatus, deleteIdea } from '@/lib/admin';

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'idea' | 'preparing'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'likes'>('likes');

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const ideasData = await getIdeas();
        setIdeas(ideasData);
      } catch (error) {
        console.error('Error fetching ideas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      if (filter === 'all') return true;
      return idea.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return b.likes - a.likes;
      } else {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
    });

  const deleteIdeaHandler = async (ideaId: string) => {
    if (!confirm('本当にこのアイデアを削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      await deleteIdea(ideaId);
      // UIから削除
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('削除に失敗しました');
    }
  };

  const updateIdeaStatusHandler = async (ideaId: string, newStatus: Idea['status']) => {
    try {
      await updateIdeaStatus(ideaId, newStatus);
      // UIを更新
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === ideaId ? { ...idea, status: newStatus } : idea
        )
      );
    } catch (error) {
      console.error('Error updating idea status:', error);
    }
  };

  const getStatusColor = (status: Idea['status']) => {
    switch (status) {
      case 'idea':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Idea['status']) => {
    switch (status) {
      case 'idea':
        return '未確認';
      case 'preparing':
        return '検討中';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ZERO-ONE 管理画面</h1>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                トップ
              </Link>
              <Link href="/admin" className="text-blue-600 font-semibold">
                管理画面
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">アイデア管理</h2>
          
          {/* フィルターとソート */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">フィルター:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">すべて</option>
                <option value="idea">未確認</option>
                <option value="preparing">検討中</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">並び替え:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="likes">👍が多い順</option>
                <option value="createdAt">新しい順</option>
              </select>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">総アイデア数</p>
              <p className="text-2xl font-bold text-blue-900">{ideas.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">未確認</p>
              <p className="text-2xl font-bold text-yellow-900">
                {ideas.filter(i => i.status === 'idea').length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">検討中</p>
              <p className="text-2xl font-bold text-purple-900">
                {ideas.filter(i => i.status === 'preparing').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">総👍数</p>
              <p className="text-2xl font-bold text-green-900">
                {ideas.reduce((sum, idea) => sum + idea.likes, 0)}
              </p>
            </div>
          </div>

          {/* アイデア一覧 */}
          <div className="space-y-4">
            {filteredAndSortedIdeas.map((idea) => (
              <div key={idea.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {idea.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{idea.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>👍 {idea.likes}</span>
                      <span>{idea.mode === 'online' ? 'オンライン' : 'オフライン'}</span>
                      <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(idea.status)}`}>
                      {getStatusText(idea.status)}
                    </span>
                    
                    <div className="flex gap-2 flex-wrap">
                      {idea.status === 'idea' && (
                        <>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'preparing')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            検討中にする
                          </button>
                          <button
                            onClick={() => idea.id && deleteIdeaHandler(idea.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            削除
                          </button>
                        </>
                      )}
                      
                      {idea.status === 'preparing' && (
                        <>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'idea')}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            未確認に戻す
                          </button>
                          <button
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            イベント化
                          </button>
                          <button
                            onClick={() => idea.id && deleteIdeaHandler(idea.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            削除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <textarea
                    placeholder="管理用メモ（非公開）..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
