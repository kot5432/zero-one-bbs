// IPアドレス取得用のユーティリティ
export async function getClientIP(): Promise<string> {
  try {
    // 簡易的なIP取得（本番環境では適切な方法を使用）
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    // エラー時はデフォルト値を返す
    return 'unknown-' + Date.now();
  }
}

// ローカルストレージからユーザーIDを取得
export function getStoredUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('zero-one-user-id');
  }
  return null;
}

// ローカルストレージにユーザーIDを保存
export function setStoredUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('zero-one-user-id', userId);
  }
}
