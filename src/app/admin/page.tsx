'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getIdeas, Idea, getAllUsers, User, deleteUser, logDeletion, getAllDeletionLogs } from '@/lib/firestore';

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deletionLogs, setDeletionLogs] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'posts' | 'data' | 'settings'>('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasData, usersData, deletionLogsData] = await Promise.all([
          getIdeas(),
          getAllUsers(),
          getAllDeletionLogs()
        ]);
        setIdeas(ideasData);
        
        // ユーザーの重複を除去（ユーザー名で最新のもののみ保持）
        const usersByName = new Map<string, User>();
        usersData.forEach(user => {
          const existing = usersByName.get(user.username);
          if (!existing || user.createdAt.toMillis() > existing.createdAt.toMillis()) {
            usersByName.set(user.username, user);
          }
        });
        setUsers(Array.from(usersByName.values()));
        
        setDeletionLogs(deletionLogsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 複数選択用関数
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user.id!)));
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.size === 0) {
      alert('削除するユーザーを選択してください');
      return;
    }

    if (!confirm(`${selectedUsers.size}人のユーザーを削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    const reason = prompt('削除理由を入力してください:');
    if (!reason) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await deleteUser(userId);
        await logDeletion('user', userId, reason, 'admin');
      }
      
      setUsers(prev => prev.filter(user => !selectedUsers.has(user.id!)));
      setSelectedUsers(new Set());
      
      alert(`${selectedUsers.size}人のユーザーを削除しました`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('削除に失敗しました');
    }
  };

  const deleteUserHandler = async (userId: string, username: string) => {
    if (!confirm(`本当にユーザー「${username}」を削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    const reason = prompt('削除理由を入力してください:');
    if (!reason) {
      return;
    }

    try {
      await deleteUser(userId);
      await logDeletion('user', userId, reason, 'admin');
      setUsers(prev => prev.filter(user => user.id !== userId));
      alert('ユーザーを削除しました');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">ZERO-ONE</h1>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-600">管理画面</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">管理者</span>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* サイドメニュー */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  📊 ダッシュボード
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('users')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === 'users' 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  👥 ユーザー管理
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('posts')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === 'posts' 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  💬 投稿管理
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('data')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === 'data' 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  📈 データ管理
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === 'settings' 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  ⚙️ 設定
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* メイン画面 */}
        <main className="flex-1 p-6">
          {/* ダッシュボード */}
          {currentView === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 ダッシュボード</h2>
              
              {/* 重要指標 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">登録ユーザー数</p>
                      <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                    </div>
                    <div className="text-3xl">👥</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">総投稿数</p>
                      <p className="text-3xl font-bold text-gray-900">{ideas.length}</p>
                    </div>
                    <div className="text-3xl">💡</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">未対応の投稿</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {ideas.filter(i => i.status === 'idea').length}
                      </p>
                    </div>
                    <div className="text-3xl">⚠️</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">検討中</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {ideas.filter(i => i.status === 'preparing').length}
                      </p>
                    </div>
                    <div className="text-3xl">🔍</div>
                  </div>
                </div>
              </div>

              {/* 注意が必要な項目 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 注意が必要な項目</h3>
                <div className="space-y-2">
                  {ideas.filter(i => i.status === 'idea').length > 0 && (
                    <p className="text-yellow-700">
                      未対応の投稿が {ideas.filter(i => i.status === 'idea').length} 件あります
                    </p>
                  )}
                  {ideas.filter(i => i.likes >= 5 && i.status === 'idea').length > 0 && (
                    <p className="text-yellow-700">
                      👍5以上の未対応投稿が {ideas.filter(i => i.likes >= 5 && i.status === 'idea').length} 件あります
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ユーザー管理 */}
          {currentView === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 ユーザー管理</h2>
              
              {/* ユーザー統計 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm font-bold text-purple-800">総ユーザー数</p>
                  <p className="text-2xl font-bold text-purple-900">{users.length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-bold text-blue-800">総投稿数</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {users.reduce((sum, user) => sum + user.postCount, 0)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm font-bold text-orange-800">総テーマ参加数</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {users.reduce((sum, user) => sum + user.themeCount, 0)}
                  </p>
                </div>
              </div>
              
              {/* 検索と絞り込み */}
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="ユーザー名で検索..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select className="px-3 py-2 border border-gray-300 rounded-md">
                    <option>すべての状態</option>
                    <option>通常</option>
                    <option>注意</option>
                    <option>要確認</option>
                  </select>
                </div>
              </div>
              
              {/* 複数選択操作バー */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={selectAllUsers}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        全選択 ({selectedUsers.size}/{users.length})
                      </span>
                    </label>
                    {selectedUsers.size > 0 && (
                      <button
                        onClick={deleteSelectedUsers}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        選択した{selectedUsers.size}人を削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ユーザーリスト */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        選択
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終利用
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        詳細
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className={selectedUsers.has(user.id!) ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id!)}
                            onChange={() => toggleUserSelection(user.id!)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">投稿: {user.postCount}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            通常
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.lastLoginAt 
                            ? user.lastLoginAt.toDate().toLocaleDateString('ja-JP')
                            : '未ログイン'
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/user/${user.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              詳細
                            </Link>
                            <button
                              onClick={() => deleteUserHandler(user.id!, user.username)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    ユーザーがまだ登録されていません
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 投稿管理 */}
          {currentView === 'posts' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">💬 投稿管理</h2>
              
              <div className="bg-white rounded-lg shadow p-6">
                <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  ＋ 新規作成
                </button>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          タイトル
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状態
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ideas.map((idea) => (
                        <tr key={idea.id}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{idea.title}</div>
                            <div className="text-sm text-gray-500">👍 {idea.likes}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              idea.status === 'idea' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : idea.status === 'preparing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {idea.status === 'idea' ? '未確認' : 
                               idea.status === 'preparing' ? '検討中' : 'イベント化'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              編集
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* データ管理 */}
          {currentView === 'data' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 データ管理</h2>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ユーザー名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状態
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          判定
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          詳細
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              普通
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              通常
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              詳細を見る
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 設定 */}
          {currentView === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ 設定</h2>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">サイト基本情報</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">サイト名</label>
                    <input
                      type="text"
                      defaultValue="ZERO-ONE"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">管理者メール</label>
                    <input
                      type="email"
                      defaultValue="admin@zero-one.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    設定を変更する
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
