'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getIdeas, Idea, getAllUsers, User, deleteUser, logDeletion, getAllDeletionLogs, updateIdea, deleteIdea, getThemes, Theme, addTheme, updateTheme, deleteTheme, Timestamp, createAdminComment, getAdminComments, AdminComment, getContacts, Contact, updateContactStatus } from '@/lib/firestore';
import Layout from '@/components/Layout';

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [deletionLogs, setDeletionLogs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'posts' | 'themes' | 'data' | 'settings' | 'contacts'>('dashboard');
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [themeForm, setThemeForm] = useState({
    title: '',
    description: '',
    targetMonth: new Date().toISOString().slice(0, 7), // YYYY-MM形式
  });

  // 統計データの計算
  const getStats = () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthIdeas = ideas.filter(idea =>
      idea.createdAt && idea.createdAt.toDate() >= thisMonth
    );

    const unconfirmedIdeas = ideas.filter(idea => idea.status === 'idea');
    const checkedIdeas = ideas.filter(idea => idea.status === 'checked');
    const preparingIdeas = ideas.filter(idea => idea.status === 'preparing');
    const eventPlannedIdeas = ideas.filter(idea => idea.status === 'event_planned');
    const rejectedIdeas = ideas.filter(idea => idea.status === 'rejected');
    const completedIdeas = ideas.filter(idea => idea.status === 'completed');

    const activeTheme = themes.find(theme => theme.isActive);

    return {
      totalUsers: users.length,
      totalPosts: ideas.length,
      thisMonthPosts: thisMonthIdeas.length,
      unconfirmedCount: unconfirmedIdeas.length,
      confirmedCount: checkedIdeas.length,
      consideringCount: preparingIdeas.length,
      eventPlannedCount: eventPlannedIdeas.length,
      rejectedCount: rejectedIdeas.length,
      completedCount: completedIdeas.length,
      activeTheme: activeTheme
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasData, usersData, themesData, deletionLogsData, contactsData] = await Promise.all([
          getIdeas(),
          getAllUsers(),
          getThemes(),
          getAllDeletionLogs(),
          getContacts()
        ]);
        setIdeas(ideasData);
        setThemes(themesData);
        setContacts(contactsData);

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

    const confirmMessage = `本当に${selectedUsers.size}人のユーザーを削除しますか？\n\n⚠️ 重要：この操作はFirestoreのユーザーデータのみ削除します。\nFirebase Authenticationのユーザーは削除されないため、同じメールアドレスでの再登録はできません。\n\nユーザー自身にアカウント削除を案内してください。`;

    if (!confirm(confirmMessage)) {
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

      alert(`${selectedUsers.size}人のユーザーを削除しました。\n\n重要：\n• Firestoreのデータは削除されました\n• Firebase Authenticationのユーザーは残っています\n• 同じメールアドレスでの再登録はできません\n• ユーザー自身にアカウント削除を案内してください`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('削除に失敗しました');
    }
  };

  const deleteUserHandler = async (userId: string, username: string) => {
    if (!confirm(`本当にユーザー「${username}」を削除しますか？\n\n⚠️ 重要：この操作はFirestoreのユーザーデータのみ削除します。\nFirebase Authenticationのユーザーは削除されないため、同じメールアドレスでの再登録はできません。\n\nユーザー自身にアカウント削除を案内してください。`)) {
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

      alert(`ユーザー「${username}」を削除しました。\n\n重要：\n• Firestoreのデータは削除されました\n• Firebase Authenticationのユーザーは残っています\n• 同じメールアドレスでの再登録はできません\n\n【緊急対応】\nFirebaseコンソールから手動でユーザーを削除してください：\n1. Firebaseコンソールにアクセス\n2. Authentication → Users に移動\n3. 該当ユーザーのメールアドレスを検索\n4. ユーザーを選択して削除\n\nまたは、ユーザー自身にマイページからアカウント削除を案内してください。`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('削除に失敗しました');
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
        targetMonth: themeForm.targetMonth,
        startDate: Timestamp.now(),
        endDate: new Timestamp(Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), 0),
        isActive: false,
        isArchived: false,
        visibility: 'draft' as 'public' | 'private' | 'draft',
        settings: {
          allowSubmissions: true,
          showInList: true,
          allowComments: true
        }
      };

      await addTheme(themeData);

      // テーマを再取得
      const themesData = await getThemes();
      setThemes(themesData);

      // フォームをリセット
      setThemeForm({
        title: '',
        description: '',
        targetMonth: new Date().toISOString().slice(0, 7)
      });
      setShowThemeForm(false);

      alert('テーマを作成しました');
    } catch (error) {
      console.error('Error creating theme:', error);
      alert('テーマの作成に失敗しました');
    }
  };

  // テーマ削除
  const deleteThemeHandler = async (themeId: string, themeTitle: string) => {
    if (!confirm(`本当にテーマ「${themeTitle}」を削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    try {
      await deleteTheme(themeId);

      // テーマを再取得
      const themesData = await getThemes();
      setThemes(themesData);

      alert(`テーマ「${themeTitle}」を削除しました。`);
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('テーマの削除に失敗しました');
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

  // ステータス変更関数
  const updateIdeaStatus = async (ideaId: string, newStatus: string) => {
    try {
      await updateIdea(ideaId, { status: newStatus as Idea['status'] });
      setIdeas(prev =>
        prev.map(idea =>
          idea.id === ideaId ? { ...idea, status: newStatus as Idea['status'] } : idea
        )
      );
    } catch (error) {
      console.error('Error updating idea status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  // ステータス変更可能か判定
  const canChangeStatus = (currentStatus: string) => {
    return currentStatus === 'idea' || currentStatus === 'preparing';
  };

  // 利用可能なステータスオプション
  const getAvailableStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'idea':
        return [
          { value: 'idea', label: '募集中', disabled: false },
          { value: 'checked', label: '確認済み', disabled: false },
        ];
      case 'checked':
        return [
          { value: 'checked', label: '確認済み', disabled: true },
        ];
      case 'preparing':
        return [
          { value: 'preparing', label: '検討中', disabled: false },
          { value: 'event_planned', label: 'イベント化決定', disabled: false },
          { value: 'rejected', label: '見送り', disabled: false },
        ];
      case 'event_planned':
        return [
          { value: 'event_planned', label: 'イベント化決定', disabled: true },
        ];
      case 'rejected':
        return [
          { value: 'rejected', label: '見送り', disabled: true },
        ];
      case 'completed':
        return [
          { value: 'completed', label: '完了', disabled: true },
        ];
      default:
        return [
          { value: currentStatus, label: currentStatus, disabled: true },
        ];
    }
  };

  // ステータス表示関数
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'idea':
        return { text: '募集中', color: 'bg-gray-100 text-gray-800', icon: '○' };
      case 'checked':
        return { text: '確認済み', color: 'bg-blue-100 text-blue-800', icon: '' };
      case 'preparing':
        return { text: '検討中', color: 'bg-yellow-100 text-yellow-800', icon: '△' };
      case 'event_planned':
        return { text: 'イベント化決定', color: 'bg-green-100 text-green-800', icon: '◉' };
      case 'rejected':
        return { text: '見送り', color: 'bg-red-100 text-red-800', icon: '×' };
      case 'completed':
        return { text: '完了', color: 'bg-purple-100 text-purple-800', icon: '●' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800', icon: '?' };
    }
  };

  const stats = getStats();

  return (
    <Layout>
      {/* 管理画面ヘッダー */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 mb-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Buildea 管理画面</h1>
            <p className="text-gray-300 text-lg">プラットフォーム運営の司令塔</p>
          </div>
          <div className="flex items-center space-x-4">
            {stats.unconfirmedCount > 0 && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg">
                未確認: {stats.unconfirmedCount}件
              </div>
            )}
            <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-medium">
              管理者
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* サイドメニュー */}
        <aside className="lg:w-64">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                      currentView === 'dashboard'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      ダッシュボード
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('users')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                      currentView === 'users'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      ユーザー管理
                    </div>
                    <div className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold">
                      {users.length}
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('posts')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                      currentView === 'posts'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      投稿管理
                    </div>
                    {stats.unconfirmedCount > 0 && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                        {stats.unconfirmedCount}
                      </div>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('themes')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                      currentView === 'themes'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      テーマ管理
                    </div>
                    <div className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold">
                      {themes.length}
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('contacts')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                      currentView === 'contacts'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      お問い合わせ管理
                    </div>
                    {contacts.filter(c => c.status === 'pending').length > 0 && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                        {contacts.filter(c => c.status === 'pending').length}
                      </div>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('data')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center ${
                      currentView === 'data'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    データ管理
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('settings')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center ${
                      currentView === 'settings'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    設定
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* メイン画面 */}
        <main className="flex-1">
          {/* ダッシュボード */}
          {currentView === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h2>

              {/* 重要指標 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今月の投稿数</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.thisMonthPosts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">未確認アイデア</p>
                      <p className="text-3xl font-bold text-red-600">{stats.unconfirmedCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">検討候補</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.consideringCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* クイックアクション */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {stats.unconfirmedCount > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">未確認アイデアを確認</h3>
                    <p className="text-gray-600 mb-4">
                      確認待ちのアイデアが{stats.unconfirmedCount}件あります
                    </p>
                    <button
                      onClick={() => setCurrentView('posts')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      未確認アイデアを見る
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">今月のテーマ</h3>
                  <p className="text-gray-600 mb-4">
                    {stats.activeTheme ? stats.activeTheme.title : '現在公開中のテーマはありません'}
                  </p>
                  <button
                    onClick={() => setCurrentView('themes')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    今月のテーマを確認
                  </button>
                </div>
              </div>

              {/* 確認済みアイデア */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">管理状況</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.unconfirmedCount}</p>
                    <p className="text-sm text-gray-600">未確認</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.confirmedCount}</p>
                    <p className="text-sm text-gray-600">確認済み</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.consideringCount}</p>
                    <p className="text-sm text-gray-600">検討中</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.eventPlannedCount}</p>
                    <p className="text-sm text-gray-600">イベント化決定</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
                    <p className="text-sm text-gray-600">見送り</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.completedCount}</p>
                    <p className="text-sm text-gray-600">完了</p>
                  </div>
                </div>
              </div>

              {/* 注意が必要な項目 */}
              {(ideas.filter(i => i.status === 'idea').length > 0 || ideas.filter(i => i.status === 'checked' && i.likes >= 5).length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">注意が必要な項目</h3>
                  <div className="space-y-2">
                    {ideas.filter(i => i.status === 'idea').length > 0 && (
                      <p className="text-yellow-700">
                        未確認のアイデアがあります ({ideas.filter(i => i.status === 'idea').length}件)
                      </p>
                    )}
                    {ideas.filter(i => i.status === 'checked' && i.likes >= 5).length > 0 && (
                      <p className="text-yellow-700">
                        いいね5以上の確認済みアイデアが {ideas.filter(i => i.status === 'checked' && i.likes >= 5).length} 件あります
                      </p>
                    )}
                    <p className="text-yellow-600 text-sm mt-2">
                      対応方法: 未確認アイデアを「確認済み」にし、いいね5以上になったら「検討中」に変更してください
                    </p>
                  </div>
                </div>
              )}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">投稿管理</h2>

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
                            <div className="text-sm text-gray-500">いいね {idea.likes} · 興味あり 0</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {users.find(u => u.id === idea.userId)?.username || '不明'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {idea.themeId ? `テーマ${idea.themeId.slice(0, 6)}` : '自由投稿'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* 確認済みチェックマーク */}
                              {(idea.status === 'checked' || idea.status === 'preparing' || idea.status === 'event_planned' || idea.status === 'rejected') && (
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                                  ✓
                                </span>
                              )}

                              {/* 状態表示 */}
                              {canChangeStatus(idea.status) ? (
                                <select
                                  value={idea.status}
                                  onChange={(e) => updateIdeaStatus(idea.id!, e.target.value)}
                                  className="px-2 py-1 text-xs rounded-full border border-gray-300"
                                >
                                  {getAvailableStatusOptions(idea.status).map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                      disabled={option.disabled}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusDisplay(idea.status).color}`}>
                                  <span className="mr-1">{getStatusDisplay(idea.status).icon}</span>
                                  {getStatusDisplay(idea.status).text}
                                </span>
                              )}
                            </div>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        対象月
                      </label>
                      <input
                        type="month"
                        value={themeForm.targetMonth}
                        onChange={(e) => setThemeForm(prev => ({ ...prev, targetMonth: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
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
                          対象月
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          公開状態
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
                              {theme.targetMonth ? `${theme.targetMonth}月` : '未設定'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${theme.visibility === 'public' ? 'bg-green-100 text-green-800' :
                                theme.visibility === 'private' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {theme.visibility === 'public' ? '公開' :
                                theme.visibility === 'private' ? '非公開' : '下書き'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${theme.isActive
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                {theme.isActive ? 'アクティブ' : '非アクティブ'}
                              </span>
                              {theme.isArchived && (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  アーカイブ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {ideas.filter(i => i.themeId === theme.id).length}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateThemeStatus(theme.id!, !theme.isActive)}
                                className={`text-sm font-medium ${theme.isActive
                                    ? 'text-gray-600 hover:text-gray-700'
                                    : 'text-green-600 hover:text-green-700'
                                  }`}
                              >
                                {theme.isActive ? '非公開にする' : '公開する'}
                              </button>
                              <button
                                onClick={() => deleteThemeHandler(theme.id!, theme.title)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
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

                {themes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    テーマがまだありません
                  </div>
                )}
              </div>
            </div>
          )}

          {/* お問い合わせ管理 */}
          {currentView === 'contacts' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📧 お問い合わせ管理</h2>

              {/* お問い合わせ統計 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-bold text-green-800">未対応</p>
                  <p className="text-2xl font-bold text-green-900">
                    {contacts.filter(c => c.status === 'pending').length}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-bold text-blue-800">対応中</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {contacts.filter(c => c.status === 'answered').length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-bold text-gray-800">対応完了</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contacts.filter(c => c.status === 'closed').length}
                  </p>
                </div>
              </div>

              {/* お問い合わせ一覧 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          お名前
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          メールアドレス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          件名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contact.createdAt?.toDate?.() ?
                              new Date(contact.createdAt.toDate()).toLocaleString('ja-JP') :
                              '不明'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contact.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contact.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={contact.subject}>
                              {contact.subject}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${contact.status === 'pending'
                                ? 'bg-red-100 text-red-800'
                                : contact.status === 'answered'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                              {contact.status === 'pending' ? '未対応' :
                                contact.status === 'answered' ? '対応中' : '対応完了'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                // 詳細表示モーダルを開く（簡易版）
                                alert(`お名前: ${contact.name}\nメール: ${contact.email}\n件名: ${contact.subject}\n内容: ${contact.message}`);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              詳細
                            </button>
                            {contact.status !== 'closed' && (
                              <button
                                onClick={async () => {
                                  const newStatus = contact.status === 'pending' ? 'answered' : 'closed';
                                  if (confirm(`ステータスを「${newStatus === 'answered' ? '対応中' : '対応完了'}」に変更しますか？`)) {
                                    await updateContactStatus(contact.id!, newStatus);
                                    // データを再取得
                                    const contactsData = await getContacts();
                                    setContacts(contactsData);
                                  }
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                {contact.status === 'pending' ? '対応開始' : '完了'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {contacts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">お問い合わせがありません</p>
                    </div>
                  )}
                </div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">設定</h2>

              {/* テーマ設定（ルール） */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">テーマ設定（ルール）</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
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
                      <span className="ml-2 text-gray-900">前テーマを自動終了する</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="text-gray-900">自由投稿を許可する</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* テーマ管理設定 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">テーマ管理設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      デフォルト公開状態
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="draft">下書き</option>
                      <option value="private">非公開</option>
                      <option value="public">公開</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-gray-900">新規テーマを自動でアクティブにする</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-gray-900">投稿をデフォルトで許可する</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-gray-900">コメントをデフォルトで許可する</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      デフォルト最大投稿数
                    </label>
                    <input
                      type="number"
                      placeholder="制限なし"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* イベント化条件 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">イベント化条件</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
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
                    <label className="block text-sm font-medium text-gray-900 mb-2">
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
                      <span className="text-gray-900">管理承認が必要（必須）</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 表示設定（最小） */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">表示設定（最小）</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      投稿表示順
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="new">新しい順</option>
                      <option value="reaction">反応順</option>
                      <option value="comments">コメント数順</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      終了テーマの扱い
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="show">表示する</option>
                      <option value="hide">非表示にする</option>
                    </select>
                  </div>
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
      </Layout>
    </div>
  );
}
