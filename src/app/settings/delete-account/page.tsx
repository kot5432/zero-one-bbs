'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { firebaseAuth } from '@/lib/auth';

export default function DeleteAccountPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!confirm('本当にアカウントを削除しますか？この操作は元に戻せません。')) {
      return;
    }

    const confirmText = prompt('削除を確定するために「削除します」と入力してください:');
    if (confirmText !== '削除します') {
      setError('確認テキストが正しくありません');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = firebaseAuth.getCurrentUser();
      if (!currentUser) {
        throw new Error('ログインしていません');
      }

      console.log('Starting account deletion for user:', currentUser.id);
      console.log('Firebase user UID:', firebaseAuth.getFirebaseUser()?.uid);

      // ユーザー自身でアカウントを削除
      await firebaseAuth.deleteUserCompletely(currentUser.id!);
      
      console.log('Account deletion completed successfully');
      alert('アカウントを削除しました。ご利用ありがとうございました。');
      router.push('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError(`アカウントの削除に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          アカウント削除
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link href="/user/profile" className="font-medium text-blue-600 hover:text-blue-500">
            マイページに戻る
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                value="⚠️ 削除すると以下のデータが失われます"
                readOnly
              />
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 投稿したすべてのアイデア</li>
                <li>• コメントやいいねの履歴</li>
                <li>• プロフィール情報</li>
                <li>• アカウント情報</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">💡 重要な注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 削除後の復元はできません</li>
                <li>• Firebase Authenticationから完全に削除されます</li>
                <li>• 同じメールアドレスで再登録できます</li>
                <li>• 削除理由は記録され、運営の参考にさせていただきます</li>
              </ul>
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '削除中...' : 'アカウントを削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
