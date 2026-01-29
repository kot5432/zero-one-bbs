import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK を使用してユーザーを完全に削除
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'ユーザーIDとメールアドレスが必要です' },
        { status: 400 }
      );
    }

    // 管理者権限の確認（簡易的な実装）
    // 本番環境では適切な認証が必要
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== 'Bearer admin-token') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    // 注意：この実装ではFirebase Admin SDKが必要
    // 現状はクライアント側での自己削除を案内する
    
    return NextResponse.json({
      success: false,
      message: '現在、ユーザー自身によるアカウント削除のみ対応しています。マイページから削除してください。',
      requiresSelfDeletion: true
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'ユーザー削除に失敗しました' },
      { status: 500 }
    );
  }
}
