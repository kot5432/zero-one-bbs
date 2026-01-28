'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getActiveTheme, Theme } from '@/lib/firestore';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

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
              <Link href="/post" className="text-blue-600 font-semibold">
                投稿
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
                募集期間: {activeTheme.startDate.toDate().toLocaleDateString('ja-JP')} 〜 {activeTheme.endDate.toDate().toLocaleDateString('ja-JP')}
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
                今月のテーマに沿ったアイデアを投稿
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-green-500 mr-2">✓</span>
                テーマが明確なので書きやすい
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-green-500 mr-2">✓</span>
                イベント化の可能性が高い
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-green-500 mr-2">✓</span>
                管理側が重点的に見ます
              </div>
            </div>

            <Link
              href="/post/theme"
              className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                activeTheme 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {activeTheme ? 'テーマで投稿する' : '現在テーマはありません'}
            </Link>
          </div>

          {/* 自由投稿 */}
          <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">自由投稿</h3>
              <p className="text-gray-600">
                テーマに関係ないアイデアを投稿
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-blue-500 mr-2">•</span>
                自由なテーマで投稿可能
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-blue-500 mr-2">•</span>
                今すぐ言いたいアイデアを共有
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-blue-500 mr-2">•</span>
                別タブで表示されます
              </div>
            </div>

            <Link
              href="/post/free"
              className="block w-full text-center py-3 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              自由で投稿する
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
