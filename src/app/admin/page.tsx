'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getIdeas, Idea, getAllUsers, User, deleteUser, logDeletion, getAllDeletionLogs, updateIdea, deleteIdea, getThemes, Theme, addTheme, updateTheme, Timestamp } from '@/lib/firestore';
import { firebaseAuth } from '@/lib/auth';

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [deletionLogs, setDeletionLogs] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'posts' | 'themes' | 'data' | 'settings'>('dashboard');
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [themeForm, setThemeForm] = useState({
    title: '',
    description: '',
    isActive: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasData, usersData, themesData, deletionLogsData] = await Promise.all([
          getIdeas(),
          getAllUsers(),
          getThemes(),
          getAllDeletionLogs()
        ]);
        setIdeas(ideasData);
        setThemes(themesData);
        
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
      // Firestoreからユーザーを削除
      await deleteUser(userId);
      await logDeletion('user', userId, reason, 'admin');
      
      // 状態を更新
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      alert('ユーザーを削除しました。\n注意：同じメールアドレスでの再登録には時間がかかる場合があります。');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('削除に失敗しました');
    }
  };

  // アイデア状態変更
  const updateIdeaStatus = async (ideaId: string, newStatus: string) => {
    try {
      await updateIdea(ideaId, { status: newStatus as Idea['status'] });
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId ? { ...idea, status: newStatus as Idea['status'] } : idea
      ));
    } catch (error) {
      console.error('Error updating idea status:', error);
      alert('状態の更新に失敗しました');
    }
  };

  // アイデア削除
  const deleteIdeaHandler = async (ideaId: string, ideaTitle: string) => {
    if (!confirm(`本当にアイデア「${ideaTitle}」を削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    const reason = prompt('削除理由を入力してください:');
    if (!reason) {
      return;
    }

    try {
      await deleteIdea(ideaId);
      await logDeletion('idea', ideaId, reason, 'admin');
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
      alert('アイデアを削除しました');
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('削除に失敗しました');
    }
  };

  // テーマ作成
  const createTheme = async () => {
    if (!themeForm.title.trim() || !themeForm.description.trim()) {
      alert('タイトルと説明は必須です');
      return;
    }

    try {
      const themeData = {
        title: themeForm.title,
        description: themeForm.description,
        startDate: Timestamp.now(),
        endDate: new Timestamp(Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), 0),
        isActive: themeForm.isActive
      };

      await addTheme(themeData);
      
      // テーマを再取得
      const themesData = await getThemes();
      setThemes(themesData);
      
      // フォームをリセット
      setThemeForm({ title: '', description: '', isActive: false });
      setShowThemeForm(false);
      
      alert('テーマを作成しました');
    } catch (error) {
      console.error('Error creating theme:', error);
      alert('テーマの作成に失敗しました');
    }
  };

  // テーマ状態変更
  const updateThemeStatus = async (themeId: string, isActive: boolean) => {
    try {
      await updateTheme(themeId, { isActive });
      
      // 他のテーマを非公開にする（同時に1つのみ公開）
      if (isActive) {
        const otherThemes = themes.filter(t => t.id !== themeId);
        for (const theme of otherThemes) {
          await updateTheme(theme.id!, { isActive: false });
        }
      }
      
      // テーマを再取得
      const themesData = await getThemes();
      setThemes(themesData);
      
      alert(isActive ? 'テーマを公開しました' : 'テーマを非公開にしました');
    } catch (error) {
      console.error('Error updating theme status:', error);
      alert('テーマの更新に失敗しました');
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
                  onClick={() => setCurrentView('themes')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === 'themes' 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  🎯 テーマ管理
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
                      <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                      <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今月の投稿数</p>
                      <p className="text-3xl font-bold text-gray-900">{ideas.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">未確認アイデア</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {ideas.filter(i => i.status === 'idea').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">確認済みアイデア</p>
                      <p className="text-3xl font-bold text-gray-600">
                        {ideas.filter(i => i.status === 'checked').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">検討候補アイデア</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {ideas.filter(i => i.status === 'checked' && i.likes >= 5).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 注意が必要な項目 */}
              {(ideas.filter(i => i.status === 'idea').length > 0 || ideas.filter(i => i.status === 'checked' && i.likes >= 5).length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 注意が必要な項目</h3>
                  <div className="space-y-2">
                    {ideas.filter(i => i.status === 'idea').length > 0 && (
                      <p className="text-yellow-700">
                        未確認のアイデアがあります ({ideas.filter(i => i.status === 'idea').length}件)
                      </p>
                    )}
                    {ideas.filter(i => i.status === 'checked' && i.likes >= 5).length > 0 && (
                      <p className="text-yellow-700">
                        👍5以上の確認済みアイデアが {ideas.filter(i => i.status === 'checked' && i.likes >= 5).length} 件あります
                      </p>
                    )}
                    <p className="text-yellow-600 text-sm mt-2">
                      💡 対応方法: 未確認アイデアを「確認済み」にし、👍5以上になったら「検討中」に変更してください
                    </p>
                  </div>
                </div>
              )}

              {/* 行動につながる要素 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentView('posts')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  未確認アイデアを見る ({ideas.filter(i => i.status === 'idea').length}件)
                </button>
                <Link
                  href="/"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                >
                  今月のテーマを見る
                </Link>
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
                          <select className="px-2 py-1 text-xs rounded-full border border-gray-300">
                            <option value="normal" className="bg-green-100 text-green-800">通常</option>
                            <option value="warning" className="bg-yellow-100 text-yellow-800">注意</option>
                            <option value="check" className="bg-red-100 text-red-800">要確認</option>
                          </select>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          タイトル
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          投稿者
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          テーマ
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
                            <div className="text-sm text-gray-500">👍 {idea.likes} · 🙋 0</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {users.find(u => u.id === idea.userId)?.username || '不明'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {idea.themeId ? `テーマ${idea.themeId.slice(0, 6)}` : '自由投稿'}
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={idea.status}
                              onChange={(e) => updateIdeaStatus(idea.id!, e.target.value)}
                              className="px-2 py-1 text-xs rounded-full border border-gray-300"
                            >
                              <option value="idea" className="bg-yellow-100 text-yellow-800">募集中</option>
                              <option value="checked" className="bg-gray-100 text-gray-800">確認済み</option>
                              <option value="preparing" className="bg-blue-100 text-blue-800">検討中</option>
                              <option value="event_planned" className="bg-green-100 text-green-800">イベント化決定</option>
                              <option value="rejected" className="bg-red-100 text-red-800">見送り</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                編集
                              </button>
                              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                                コメント
                              </button>
                              <button 
                                onClick={() => deleteIdeaHandler(idea.id!, idea.title)}
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
                </div>
              </div>
            </div>
          )}

          {/* テーマ管理 */}
          {currentView === 'themes' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 テーマ管理</h2>
              
              {/* テーマ作成フォーム */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">テーマ作成</h3>
                  <button
                    onClick={() => setShowThemeForm(!showThemeForm)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {showThemeForm ? '閉じる' : '開く'}
                  </button>
                </div>
                
                {showThemeForm && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        タイトル
                      </label>
                      <input
                        type="text"
                        value={themeForm.title}
                        onChange={(e) => setThemeForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="テーマタイトルを入力"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        説明
                      </label>
                      <textarea
                        value={themeForm.description}
                        onChange={(e) => setThemeForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="なぜこのテーマかを説明"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={themeForm.isActive}
                        onChange={(e) => setThemeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">公開する</span>
                    </div>
                    <button
                      onClick={createTheme}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      テーマを作成
                    </button>
                  </div>
                )}
              </div>
              
              {/* テーマ一覧 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">テーマ一覧</h3>
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
                          投稿数
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {themes.map((theme) => (
                        <tr key={theme.id}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{theme.title}</div>
                            <div className="text-sm text-gray-500">
                              {theme.startDate.toDate().toLocaleDateString('ja-JP')} 〜 {theme.endDate.toDate().toLocaleDateString('ja-JP')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              theme.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {theme.isActive ? '公開中' : '非公開'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {ideas.filter(i => i.themeId === theme.id).length}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => updateThemeStatus(theme.id!, !theme.isActive)}
                              className={`text-sm font-medium ${
                                theme.isActive
                                  ? 'text-gray-600 hover:text-gray-700'
                                  : 'text-green-600 hover:text-green-700'
                              }`}
                            >
                              {theme.isActive ? '非公開にする' : '公開する'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {themes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    テーマがまだありません
                  </div>
                )}
              </div>
            </div>
          )}

          {/* データ管理 */}
          {currentView === 'data' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 データ管理</h2>
              
              {/* データ概要 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">テーマ別投稿数</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">自由投稿</span>
                      <span className="font-bold">{ideas.filter(i => !i.themeId).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">テーマ投稿</span>
                      <span className="font-bold">{ideas.filter(i => i.themeId).length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">いいね数・参加意思数</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">総いいね数</span>
                      <span className="font-bold">{ideas.reduce((sum, i) => sum + i.likes, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均いいね数</span>
                      <span className="font-bold">{ideas.length > 0 ? Math.round(ideas.reduce((sum, i) => sum + i.likes, 0) / ideas.length) : 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">イベント化率</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">イベント化済み</span>
                      <span className="font-bold">{ideas.filter(i => i.status === 'event_planned').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">イベント化率</span>
                      <span className="font-bold">{ideas.length > 0 ? Math.round((ideas.filter(i => i.status === 'event_planned').length / ideas.length) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 活用方法 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">活用方法</h3>
                <div className="space-y-3 text-blue-800">
                  <p><strong>次のテーマを決める:</strong> 投稿数とイベント化率を参考に</p>
                  <p><strong>「この企画は需要がある」と説明する:</strong> 数字で実績を証明</p>
                  <p><strong>協力者・支援者に見せる:</strong> 具体的な利用実績を提示</p>
                </div>
              </div>
            </div>
          )}

          {/* 設定 */}
          {currentView === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ 設定</h2>
              
              {/* テーマ設定（ルール） */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 テーマ設定（ルール）</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      同時公開テーマ数
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="1">1（推奨）</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">前テーマを自動終了する</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">自由投稿を許可する</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* イベント化条件 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 イベント化条件</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      参加意思 ◯人以上
                    </label>
                    <input
                      type="number"
                      placeholder="5"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      いいね ◯以上
                    </label>
                    <input
                      type="number"
                      placeholder="10"
                      defaultValue="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked disabled />
                      <span className="text-sm text-gray-700">管理承認が必要（必須）</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* 表示設定（最小） */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 表示設定（最小）</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      投稿表示順
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="new">新しい順</option>
                      <option value="reaction">反応順</option>
                      <option value="comments">コメント数順</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了テーマの表示
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="show">表示する</option>
                      <option value="hide">非表示にする</option>
                      <option value="archive">アーカイブとして表示</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 運営メッセージ設定 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📢 運営メッセージ設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      トップ表示メッセージ
                    </label>
                    <textarea
                      placeholder="今月は〇〇を考えます"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      テーマ補足文
                    </label>
                    <textarea
                      placeholder="テーマについての補足説明"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  設定を変更する
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                  リセット
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
