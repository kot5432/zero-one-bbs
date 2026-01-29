'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      
      // ログイン成功後、リダイレクト先を確認
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
      router.push(redirectUrl || '/');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Firebaseエラーコードに応じた具体的なメッセージ
      if (err.code === 'auth/user-not-found') {
        setError('ユーザーが見つかりません。メールアドレスを確認してください。');
      } else if (err.code === 'auth/wrong-password') {
        setError('パスワードが違います。もう一度確認してください。');
      } else if (err.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません。確認してもう一度入力してください。');
      } else if (err.code === 'auth/user-disabled') {
        setError('このアカウントは無効になっています。管理者にお問い合わせください。');
      } else if (err.code === 'auth/too-many-requests') {
        setError('リクエストが多すぎます。しばらく待ってからもう一度お試しください。');
      } else if (err.code === 'auth/network-request-failed') {
        setError('ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。');
      } else if (err.message === 'ユーザーが見つかりません') {
        setError('ユーザーが見つかりません。新規登録をお試しください。');
      } else {
        setError(`ログインに失敗しました: ${err.message || '不明なエラー'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          ZERO-ONE ログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          または{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            新規アカウントを作成
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-medium">ログインエラー</span>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 autofill:bg-white autofill:text-gray-900"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 autofill:bg-white autofill:text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                トップページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
