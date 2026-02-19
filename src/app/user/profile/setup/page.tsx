'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/auth';

export default function ProfileSetupPage() {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 現在のユーザー情報を取得
    const currentUser = firebaseAuth.getCurrentUser();
    if (currentUser) {
      setDisplayName(currentUser.username);
    } else {
      // ユーザーがいない場合はログイン画面へ
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!displayName.trim()) {
      setError('表示名を入力してください');
      setLoading(false);
      return;
    }

    try {
      const currentUser = firebaseAuth.getCurrentUser();
      if (!currentUser) {
        throw new Error('ユーザー情報が見つかりません');
      }

      // ここでプロフィール更新処理を実装（将来的に）
      // 今は簡単にマイページへリダイレクト

      alert('プロフィール設定が完了しました！\nBuildeaへようこそ！');
      router.push(`/user/${currentUser.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const currentUser = firebaseAuth.getCurrentUser();
    if (currentUser) {
      alert('プロフィール設定は後からいつでも変更できます。\nBuildeaへようこそ！');
      router.push(`/user/${currentUser.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          プロフィール設定
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウント作成ありがとうございます！<br />
          プロフィールを設定して、Buildeaを始めましょう
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                表示名（ニックネーム）
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="山田太郎"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                他のユーザーに表示される名前です。後から変更できます。
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">🎉 Buildeaへようこそ！</h3>
              <p className="text-sm text-blue-700">
                これからアイデアを投稿したり、他の人のアイデアに共感したりできます。<br />
                まずは簡単なプロフィール設定をしましょう！
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : 'プロフィールを保存'}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                後で設定する
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              プロフィール設定はいつでもマイページから変更できます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
