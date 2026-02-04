'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signUp } = useUserAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // バリデーション
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, displayName);
      
      // 登録成功後、自動でログイン状態に
      alert('アカウントを作成しました！\n次にプロフィール設定を行います。');
      
      // プロフィール設定画面へ遷移
      router.push('/user/profile/setup');
    } catch (err: any) {
      console.error('Signup error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Firebaseエラーコードに応じた具体的なメッセージ
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています。ログインするか、別のメールアドレスをお試しください。');
      } else if (err.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません。確認してもう一度入力してください。');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます。より強力なパスワードを設定してください。');
      } else if (err.code === 'auth/network-request-failed') {
        setError('ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。');
      } else if (err.code === 'auth/too-many-requests') {
        setError('リクエストが多すぎます。しばらく待ってからもう一度お試しください。');
      } else if (err.code === 'auth/internal-error') {
        setError('システムエラーが発生しました。時間をおいてもう一度お試しください。');
      } else {
        setError(`アカウント作成に失敗しました: ${err.message || '不明なエラー'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          ZERO-ONE アカウント作成
        </h2>
        <p className="mt-2 text-center text-sm text-gray-700">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            ログイン
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
                    <span className="font-medium">登録エラー</span>
                    <p className="text-sm mt-1">{error}</p>
                    {error.includes('email-already-in-use') && (
                      <div className="mt-2 p-3 bg-red-50 rounded text-xs">
                        <strong>解決方法：</strong><br/>
                        このメールアドレスは既に使用されています。<br/><br/>
                        <strong>1. 既存ユーザーの場合：</strong><br/>
                        <a href="/login" className="text-blue-600 underline font-medium">→ ログイン画面へ</a><br/><br/>
                        
                        <strong>2. アカウント削除後の場合：</strong><br/>
                        Firebaseコンソールから手動で削除が必要です。<br/><br/>
                        <strong>Firebaseコンソールでの削除手順：</strong><br/>
                        ① Firebaseコンソールにアクセス<br/>
                        ② Authentication → Users に移動<br/>
                        ③ 該当メールアドレスを検索<br/>
                        ④ ユーザーを選択して削除<br/><br/>
                        
                        <strong>3. セルフ削除の場合：</strong><br/>
                        マイページ → 設定 → アカウント削除から削除してください。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
                デバッグ: エラー状態を監視中
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-800">
                表示名（ニックネーム）
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 autofill:bg-white autofill:text-gray-900"
                  placeholder="山田太郎"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 autofill:bg-white autofill:text-gray-900"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 autofill:bg-white autofill:text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800">
                パスワード（確認）
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? '作成中...' : 'アカウント作成'}
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
                className="font-medium text-gray-700 hover:text-gray-900"
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
