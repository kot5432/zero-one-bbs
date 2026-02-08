'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getActiveTheme, Theme } from '@/lib/firestore';
import Header from '@/components/Header';

export default function PostSelectPage() {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const theme = await getActiveTheme();
        setActiveTheme(theme);
      } catch (error) {
        console.error('Error fetching theme:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTheme();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-20">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            アイデアを投稿する
          </h2>
          <p className="text-xl text-gray-600">
            どの形式で投稿しますか？
          </p>
        </div>

        {/* 現在のテーマ */}
        {activeTheme && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">今月のテーマ</p>
              <h3 className="text-2xl font-bold mb-2">{activeTheme.title}</h3>
              <p className="text-base mb-3 opacity-90">{activeTheme.description}</p>
              <p className="text-sm opacity-80">
                募集期間: {activeTheme.startDate?.toDate?.() ? 
                  activeTheme.startDate.toDate().toLocaleDateString('ja-JP') : '不明'
                } 〜 {activeTheme.endDate?.toDate?.() ? 
                  activeTheme.endDate.toDate().toLocaleDateString('ja-JP') : '不明'
                }
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* テーマ投稿 */}
          <div className="bg-white rounded-lg shadow-md p-8 border-2 border-blue-200 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                おすすめ
              </span>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">テーマに投稿する</h3>
              <p className="text-gray-600">
                今月のテーマに沿ったアイデアを投稿します。テーマ期間中は特別な表示がされます。
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">テーマ期間中は特別表示</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">イベント化の可能性が高い</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">コミュニティの注目を集めやすい</span>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/post/theme')}
              disabled={!activeTheme}
              className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {activeTheme ? 'テーマで投稿する' : 'テーマがありません'}
            </button>
          </div>

          {/* フリー投稿 */}
          <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">自由に投稿する</h3>
              <p className="text-gray-600">
                テーマに縛られず、自由なアイデアを投稿します。いつでも投稿可能です。
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">いつでも投稿可能</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">自由なテーマでOK</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">独自の切り口で発案</span>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/post/free')}
              className="w-full mt-6 bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              自由に投稿する
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
