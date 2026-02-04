'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getIdeas, likeIdea, addComment, getComments, Idea, Comment, getUserIp, hasUserLiked } from '@/lib/firestore';
import { useUserAuth } from '@/contexts/UserAuthContext';
import Header from '@/components/Header';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const { user } = useUserAuth();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [userIp, setUserIp] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ideasData = await getIdeas();
        const foundIdea = ideasData.find(i => i.id === ideaId);
        
        if (!foundIdea) {
          router.push('/');
          return;
        }
        
        setIdea(foundIdea);
        
        const commentsData = await getComments(ideaId);
        setComments(commentsData);

        // ユーザーIPを取得して共感状態をチェック
        const currentUserIp = getUserIp();
        setUserIp(currentUserIp);
        const liked = await hasUserLiked(ideaId, currentUserIp);
        setHasLiked(liked);
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ideaId, router]);

  const handleLike = async () => {
    if (!idea || liking || hasLiked) return;
    
    setLiking(true);
    try {
      await likeIdea(ideaId, userIp);
      setIdea(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      setHasLiked(true);
    } catch (error) {
      console.error('Error liking idea:', error);
      alert('すでに共感しています');
    } finally {
      setLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      await addComment({
        ideaId,
        text: commentText.trim()
      });
      
      const commentsData = await getComments(ideaId);
      setComments(commentsData);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRealizeClick = () => {
    alert('実現に動きたい機能は現在準備中です。ご期待ください！');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">アイデアが見つかりません</h1>
            <p className="text-gray-600 mb-6">指定されたアイデアは存在しないか、削除された可能性があります。</p>
            <Link
              href="/ideas"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              アイデア一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex-1">{idea.title}</h2>
            <span
              className={`px-3 py-1 text-sm rounded-full ml-4 ${
                idea.status === 'idea'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {idea.status === 'idea' ? 'アイデア' : '準備中'}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-lg text-gray-700 whitespace-pre-wrap">{idea.description}</p>
          </div>

          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <div className="flex items-center">
              <span className="mr-2">形式:</span>
              <span className="font-medium">
                {idea.mode === 'online' ? 'オンライン' : 'オフライン'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">投稿日時:</span>
              <span className="font-medium">
                {idea.createdAt?.toDate()?.toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={handleLike}
              disabled={liking || hasLiked}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                hasLiked 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
              }`}
            >
              <span className="text-xl">👍</span>
              <span>{hasLiked ? '共感済み' : `共感する`} ({idea.likes})</span>
            </button>
            
            <button
              onClick={handleRealizeClick}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              🙋 参加したい
            </button>
          </div>

          {/* 状態表示 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">【状態】</h3>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  idea.status === 'idea'
                    ? 'bg-yellow-100 text-yellow-800'
                    : idea.status === 'preparing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {idea.status === 'idea' ? '募集中' : 
                 idea.status === 'preparing' ? '検討中（管理側）' : 'イベント化決定'}
              </span>
              <span className="text-sm text-gray-600">
                管理側が「検討中」にすると自動で変わります
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">コメント ({comments.length})</h3>
          
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを入力（名前なし・短文でOK）"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingComment ? '投稿中...' : '投稿'}
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだコメントがありません。最初のコメントを投稿しましょう！
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <p className="text-gray-800 mb-2">{comment.text}</p>
                  <p className="text-sm text-gray-500">
                    {comment.createdAt?.toDate()?.toLocaleDateString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
