'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getIdeas, Idea } from '@/lib/firestore';

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ZERO-ONE</h1>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                トップ
              </Link>
              <Link href="/post" className="text-gray-700 hover:text-gray-900">
                投稿
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            学生のアイデアを形にする場所
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            学生の「やってみたい」を、仲間とイベントにする場所
          </p>
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-8 max-w-2xl mx-auto">
            <p className="text-sm">
              <strong>どうやってイベントになるの？</strong><br/>
              ① アイデアを投稿 → ② 👍が集まる → ③ 管理者がイベント化検討 → ④ 正式なイベントに！
            </p>
          </div>
          <Link
            href="/post"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            アイデアを投稿する
          </Link>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">最新のアイデア</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">まだアイデアがありません</p>
              <Link
                href="/post"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                最初のアイデアを投稿する
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/idea/${idea.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {idea.title}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        idea.status === 'idea'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {idea.status === 'idea' ? 'アイデア' : '準備中'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {idea.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-gray-500">
                      <span className="text-lg mr-1">👍</span>
                      <span className="font-semibold">{idea.likes}</span>
                      <span className="ml-1 text-sm">人が興味あり</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <span className="text-sm mr-1">
                        {idea.mode === 'online' ? 'オンライン' : 'オフライン'}
                      </span>
                    </div>
                  </div>

                  {idea.likes >= 3 && (
                    <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded text-center">
                      イベント化検討中
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}