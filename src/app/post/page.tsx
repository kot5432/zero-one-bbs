'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostPage() {
  const router = useRouter();

  useEffect(() => {
    // 投稿選択ページにリダイレクト
    router.replace('/post/select');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">リダイレクト中...</p>
    </div>
  );
}
