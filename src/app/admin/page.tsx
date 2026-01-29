'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { getIdeas, Idea, getThemes, Theme, getActiveTheme, createTheme, updateTheme, getEvents, Event, Timestamp, db, deleteTheme, deleteIdea, getAllUsers, User, deleteUser, logDeletion, getAllDeletionLogs } from '@/lib/firestore';
import { updateIdeaStatus, updateAdminMemo, updateAdminChecklist } from '@/lib/admin';

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deletionLogs, setDeletionLogs] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'idea' | 'preparing' | 'event_planned'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'likes'>('likes');
  const [modeFilter, setModeFilter] = useState<'all' | 'online' | 'offline'>('all');
  
  // テーマ作成用
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    eventDate: ''
  });

  // 拡張管理機能用
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [editingIdeas, setEditingIdeas] = useState<Set<string>>(new Set());
  
  // 削除確認用
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'theme' | 'idea' | null;
    id: string | null;
    title: string;
    reason: string;
  }>({
    type: null,
    id: null,
    title: '',
    reason: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasData, themesData, activeThemeData, eventsData, usersData, deletionLogsData] = await Promise.all([
          getIdeas(),
          getThemes(),
          getActiveTheme(),
          getEvents(),
          getAllUsers(),
          getAllDeletionLogs()
        ]);
        setIdeas(ideasData);
        setThemes(themesData);
        setActiveTheme(activeThemeData);
        setEvents(eventsData);
        
        // デバッグ情報：取得したユーザーデータを確認
        console.log('取得したユーザーデータ（重複除去前）:', usersData);
        console.log('ユーザーID一覧:', usersData.map(user => ({ 
          id: user.id, 
          username: user.username,
          createdAt: user.createdAt.toDate().toLocaleString('ja-JP')
        })));
        
        // ユーザーの重複を除去（ユーザー名で最新のもののみ保持）
        const usersByName = new Map<string, User>();
        usersData.forEach(user => {
          const existing = usersByName.get(user.username);
          if (!existing || user.createdAt.toMillis() > existing.createdAt.toMillis()) {
            usersByName.set(user.username, user);
          }
        });
        
        const uniqueUsers = Array.from(usersByName.values());
        
        console.log('ユーザー名で重複除去後のユーザー数:', uniqueUsers.length);
        console.log('ユーザー名で重複除去後のユーザー:', uniqueUsers.map(user => ({ 
          id: user.id, 
          username: user.username,
          createdAt: user.createdAt.toDate().toLocaleString('ja-JP')
        })));
        
        // 最新のユーザーを確認
        const sortedUsers = uniqueUsers.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        console.log('最新のユーザー（5人）:', sortedUsers.slice(0, 5).map(user => ({
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toDate().toLocaleString('ja-JP')
        })));
        
        setUsers(uniqueUsers);
        setDeletionLogs(deletionLogsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      if (filter === 'all') return idea.status !== 'rejected' && idea.status !== 'completed';
      return idea.status === filter;
    })
    .filter(idea => {
      if (modeFilter === 'all') return true;
      return idea.mode === modeFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return b.likes - a.likes;
      } else {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
    });

  const deleteIdeaHandler = async (ideaId: string) => {
    if (!confirm('本当にこのアイデアを削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      await deleteIdea(ideaId);
      // UIから削除
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('削除に失敗しました');
    }
  };

  const updateIdeaStatusHandler = async (ideaId: string, newStatus: Idea['status'], details?: string) => {
    try {
      await updateIdeaStatus(ideaId, newStatus, details);
      // UIを更新
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === ideaId ? { ...idea, status: newStatus } : idea
        )
      );
    } catch (error) {
      console.error('Error updating idea status:', error);
    }
  };

  const updateAdminMemoHandler = async (ideaId: string, memo: string) => {
    try {
      await updateAdminMemo(ideaId, memo);
      // UIを更新
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === ideaId ? { ...idea, adminMemo: memo } : idea
        )
      );
    } catch (error) {
      console.error('Error updating admin memo:', error);
    }
  };

  const updateAdminChecklistHandler = async (ideaId: string, checklist: { safety?: boolean; popularity?: boolean; manageable?: boolean }) => {
    try {
      await updateAdminChecklist(ideaId, checklist);
      // UIを更新
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === ideaId ? { ...idea, adminChecklist: checklist } : idea
        )
      );
    } catch (error) {
      console.error('Error updating admin checklist:', error);
    }
  };

  // ユーザー削除関数
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
      
      // 削除理由を記録
      await logDeletion('user', userId, reason, 'admin');
      
      // UIを更新
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      alert('ユーザーを削除しました');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('削除に失敗しました');
    }
  };

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
      // 選択されたユーザーを削除
      for (const userId of selectedUsers) {
        await deleteUser(userId);
        await logDeletion('user', userId, reason, 'admin');
      }
      
      // UIを更新
      setUsers(prev => prev.filter(user => !selectedUsers.has(user.id!)));
      setSelectedUsers(new Set());
      
      alert(`${selectedUsers.size}人のユーザーを削除しました`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('削除に失敗しました');
    }
  };

  // 削除確認ダイアログ
  const showDeleteConfirm = (type: 'theme' | 'idea', id: string, title: string) => {
    setDeleteConfirm({
      type,
      id,
      title,
      reason: ''
    });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({
      type: null,
      id: null,
      title: '',
      reason: ''
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    try {
      if (deleteConfirm.type === 'theme') {
        await deleteTheme(deleteConfirm.id);
        setThemes(prev => prev.filter(theme => theme.id !== deleteConfirm.id));
        if (activeTheme?.id === deleteConfirm.id) {
          setActiveTheme(null);
        }
      } else if (deleteConfirm.type === 'idea') {
        await deleteIdea(deleteConfirm.id);
        setIdeas(prev => prev.filter(idea => idea.id !== deleteConfirm.id));
      }
      
      hideDeleteConfirm();
      alert(`${deleteConfirm.type === 'theme' ? 'テーマ' : '投稿'}を削除しました`);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('削除に失敗しました');
    }
  };

  // 拡張管理機能
  const toggleIdeaExpansion = (ideaId: string) => {
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(ideaId)) {
      newExpanded.delete(ideaId);
    } else {
      newExpanded.add(ideaId);
    }
    setExpandedIdeas(newExpanded);
  };

  const toggleIdeaEditing = (ideaId: string) => {
    const newEditing = new Set(editingIdeas);
    if (newEditing.has(ideaId)) {
      newEditing.delete(ideaId);
    } else {
      newEditing.add(ideaId);
    }
    setEditingIdeas(newEditing);
  };

  const updateIdeaExtendedHandler = async (ideaId: string, updates: Partial<Idea>) => {
    try {
      // アクション履歴を追加
      const actionHistory = {
        action: 'extended_update',
        timestamp: Timestamp.now(),
        details: '拡張情報を更新'
      };

      const ideaRef = doc(db, 'ideas', ideaId);
      await updateDoc(ideaRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        actionHistory: actionHistory
      });

      // UIを更新
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === ideaId ? { ...idea, ...updates } : idea
        )
      );
    } catch (error) {
      console.error('Error updating idea extended:', error);
      alert('更新に失敗しました');
    }
  };

  // イベント化可能度を計算
  const calculateFeasibilityScore = (idea: Idea): number => {
    let score = 0;
    
    // 👍数（10点満点）
    if (idea.likes >= 10) score += 1;
    if (idea.likes >= 20) score += 1;
    
    // チェックリスト（3点満点）
    const checklist = idea.adminChecklist;
    if (checklist?.safety) score += 1;
    if (checklist?.popularity) score += 1;
    if (checklist?.manageable) score += 1;
    
    // テーマ投稿（1点）
    if (idea.themeId) score += 1;
    
    return Math.min(score, 5);
  };

  // テーマ管理関数
  const createThemeHandler = async () => {
    if (!newTheme.title || !newTheme.description || !newTheme.startDate || !newTheme.endDate) {
      alert('すべての必須項目を入力してください');
      return;
    }

    try {
      if (editingThemeId) {
        // 編集モード
        const updateData: any = {
          title: newTheme.title,
          description: newTheme.description,
          startDate: Timestamp.fromDate(new Date(newTheme.startDate)),
          endDate: Timestamp.fromDate(new Date(newTheme.endDate)),
          ...(newTheme.eventDate && { eventDate: Timestamp.fromDate(new Date(newTheme.eventDate)) }),
          updatedAt: Timestamp.now()
        };

        await updateTheme(editingThemeId, updateData);
        alert('テーマを更新しました');
      } else {
        // 新規作成モード
        // 既存のアクティブテーマを非アクティブに
        if (activeTheme) {
          await updateTheme(activeTheme.id!, { isActive: false });
        }

        const themeData = {
          title: newTheme.title,
          description: newTheme.description,
          startDate: Timestamp.fromDate(new Date(newTheme.startDate)),
          endDate: Timestamp.fromDate(new Date(newTheme.endDate)),
          ...(newTheme.eventDate && { eventDate: Timestamp.fromDate(new Date(newTheme.eventDate)) }),
          isActive: true
        };

        await createTheme(themeData);
        alert('テーマを作成しました');
      }
      
      // データを再取得
      const [themesData, activeThemeData] = await Promise.all([
        getThemes(),
        getActiveTheme()
      ]);
      setThemes(themesData);
      setActiveTheme(activeThemeData);
      
      // フォームをリセット
      setNewTheme({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        eventDate: ''
      });
      setEditingThemeId(null);
      setShowThemeForm(false);
      
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('テーマの保存に失敗しました');
    }
  };

  const updateThemeHandler = async (themeId: string, updates: Partial<Theme>) => {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // 文字列の日付をTimestampに変換
      if (updates.startDate) {
        const startDate = updates.startDate as any;
        updateData.startDate = typeof startDate === 'string' 
          ? Timestamp.fromDate(new Date(startDate))
          : startDate;
      }
      if (updates.endDate) {
        const endDate = updates.endDate as any;
        updateData.endDate = typeof endDate === 'string' 
          ? Timestamp.fromDate(new Date(endDate))
          : endDate;
      }
      if (updates.eventDate) {
        const eventDate = updates.eventDate as any;
        updateData.eventDate = typeof eventDate === 'string' 
          ? Timestamp.fromDate(new Date(eventDate))
          : eventDate;
      }

      await updateTheme(themeId, updateData);
      
      // データを再取得
      const [themesData, activeThemeData] = await Promise.all([
        getThemes(),
        getActiveTheme()
      ]);
      setThemes(themesData);
      setActiveTheme(activeThemeData);
      
      alert('テーマを更新しました');
    } catch (error) {
      console.error('Error updating theme:', error);
      alert('テーマの更新に失敗しました');
    }
  };

  const getStatusColor = (status: Idea['status']) => {
    switch (status) {
      case 'idea':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'event_planned':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Idea['status']) => {
    switch (status) {
      case 'idea':
        return '未確認';
      case 'preparing':
        return '検討中';
      case 'event_planned':
        return 'イベント化予定';
      case 'rejected':
        return '見送り';
      case 'completed':
        return '対応済み';
      default:
        return status;
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ZERO-ONE 管理画面</h1>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                トップ
              </Link>
              <Link href="/admin" className="text-blue-600 font-semibold">
                管理画面
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* テーマ管理セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">月1テーマ管理</h2>
            <button
              onClick={() => setShowThemeForm(!showThemeForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showThemeForm ? '閉じる' : '新しいテーマを作成'}
            </button>
          </div>

          {/* 現在のテーマ */}
          {activeTheme && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-green-800">現在のテーマ</h3>
                <button
                  onClick={() => {
                    setEditingThemeId(activeTheme.id!);
                    setNewTheme({
                      title: activeTheme.title,
                      description: activeTheme.description,
                      startDate: activeTheme.startDate.toDate().toISOString().split('T')[0],
                      endDate: activeTheme.endDate.toDate().toISOString().split('T')[0],
                      eventDate: activeTheme.eventDate ? activeTheme.eventDate.toDate().toISOString().split('T')[0] : ''
                    });
                    setShowThemeForm(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  編集
                </button>
              </div>
              <h4 className="font-medium text-green-900">{activeTheme.title}</h4>
              <p className="text-green-700 mb-2">{activeTheme.description}</p>
              <div className="text-sm text-green-600">
                <p>募集期間: {activeTheme.startDate.toDate().toLocaleDateString('ja-JP')} 〜 {activeTheme.endDate.toDate().toLocaleDateString('ja-JP')}</p>
                {activeTheme.eventDate && (
                  <p>イベント日: {activeTheme.eventDate.toDate().toLocaleDateString('ja-JP')}</p>
                )}
              </div>
            </div>
          )}

          {/* テーマ作成フォーム */}
          {showThemeForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingThemeId ? 'テーマを編集' : '新しいテーマを作成'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">テーマタイトル *</label>
                  <input
                    type="text"
                    value={newTheme.title}
                    onChange={(e) => setNewTheme({...newTheme, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例：学校生活を少し良くするアイデア"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">テーマ説明 *</label>
                  <textarea
                    value={newTheme.description}
                    onChange={(e) => setNewTheme({...newTheme, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="テーマの詳細な説明を記入してください"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">募集開始日 *</label>
                    <input
                      type="date"
                      value={newTheme.startDate}
                      onChange={(e) => setNewTheme({...newTheme, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">募集終了日 *</label>
                    <input
                      type="date"
                      value={newTheme.endDate}
                      onChange={(e) => setNewTheme({...newTheme, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">イベント日（任意）</label>
                    <input
                      type="date"
                      value={newTheme.eventDate}
                      onChange={(e) => setNewTheme({...newTheme, eventDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createThemeHandler}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingThemeId ? 'テーマを更新' : 'テーマを作成'}
                  </button>
                  <button
                    onClick={() => {
                      setNewTheme({
                        title: '',
                        description: '',
                        startDate: '',
                        endDate: '',
                        eventDate: ''
                      });
                      setEditingThemeId(null);
                      setShowThemeForm(false);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 過去のテーマ一覧 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">過去のテーマ</h3>
            <div className="space-y-3">
              {themes.filter(theme => !theme.isActive).map((theme) => (
                <div key={theme.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{theme.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{theme.description}</p>
                      <p className="text-xs text-gray-500">
                        {theme.startDate.toDate().toLocaleDateString('ja-JP')} 〜 {theme.endDate.toDate().toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <button
                      onClick={() => showDeleteConfirm('theme', theme.id!, theme.title)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
              {themes.filter(theme => !theme.isActive).length === 0 && (
                <p className="text-gray-500 text-sm">過去のテーマはありません</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">アイデア管理</h2>
          
          {/* フィルターとソート */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-900">ステータス:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-900"
              >
                <option value="all">すべて</option>
                <option value="idea">未確認</option>
                <option value="preparing">検討中</option>
                <option value="event_planned">イベント化予定</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-900">実施形式:</label>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-900"
              >
                <option value="all">すべて</option>
                <option value="online">オンライン</option>
                <option value="offline">オフライン</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-900">並び替え:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-900"
              >
                <option value="likes">👍が多い順</option>
                <option value="createdAt">新しい順</option>
              </select>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-bold text-blue-800">総アイデア数</p>
              <p className="text-2xl font-bold text-blue-900">{ideas.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm font-bold text-yellow-800">未確認</p>
              <p className="text-2xl font-bold text-yellow-900">
                {ideas.filter(i => i.status === 'idea').length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-bold text-purple-800">検討中</p>
              <p className="text-2xl font-bold text-purple-900">
                {ideas.filter(i => i.status === 'preparing').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-bold text-green-800">イベント化予定</p>
              <p className="text-2xl font-bold text-green-900">
                {ideas.filter(i => i.status === 'event_planned').length}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <p className="text-sm font-bold text-indigo-800">今月テーマ投稿</p>
              <p className="text-2xl font-bold text-indigo-900">
                {activeTheme ? ideas.filter(i => i.themeId === activeTheme.id).length : 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-bold text-gray-800">総👍数</p>
              <p className="text-2xl font-bold text-gray-900">
                {ideas.reduce((sum, idea) => sum + idea.likes, 0)}
              </p>
            </div>
          </div>

          {/* アイデア一覧 */}
          <div className="space-y-2">
            {filteredAndSortedIdeas.map((idea) => (
              <div key={idea.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    {/* 現在ステータスの明示 */}
                    <div className="mb-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(idea.status)}`}>
                        {getStatusText(idea.status)}
                      </span>
                    </div>
                    
                    <h3 
                      className="text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => toggleIdeaExpansion(idea.id!)}
                    >
                      {idea.title}
                    </h3>
                    
                    {/* 次のアクション */}
                    {idea.nextAction && (
                      <div className="mt-1">
                        <span className="text-sm font-medium text-orange-700">
                          次のアクション: {idea.nextAction}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleIdeaExpansion(idea.id!)}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      {expandedIdeas.has(idea.id!) ? '閉じる' : '開く'}
                    </button>
                  </div>
                </div>
                
                {/* 詳細情報（展開時のみ表示） */}
                {expandedIdeas.has(idea.id!) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* 基本情報 */}
                    <div>
                      <p className="text-gray-800 mb-2 font-medium">{idea.description}</p>
                      <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
                        <span>👍 {idea.likes}</span>
                        <span>{idea.mode === 'online' ? 'オンライン' : 'オフライン'}</span>
                        <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                        {idea.updatedAt && (
                          <span className="text-xs text-gray-600">
                            最終更新：{idea.updatedAt.toDate().toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* アクション履歴 */}
                    {idea.actionHistory && idea.actionHistory.length > 0 && (
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        <p className="font-bold text-gray-800 mb-1">最近の操作:</p>
                        {idea.actionHistory.slice(-2).map((action, index) => (
                          <div key={index} className="text-gray-700 font-medium">
                            {action.timestamp.toDate().toLocaleDateString('ja-JP')} - {action.details}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 管理用チェックリスト */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">管理チェックリスト:</p>
                      <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={idea.adminChecklist?.safety || false}
                            onChange={(e) => idea.id && updateAdminChecklistHandler(idea.id, {
                              ...idea.adminChecklist,
                              safety: e.target.checked
                            })}
                            className="rounded"
                          />
                          安全面に問題なし
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={idea.adminChecklist?.popularity || false}
                            onChange={(e) => idea.id && updateAdminChecklistHandler(idea.id, {
                              ...idea.adminChecklist,
                              popularity: e.target.checked
                            })}
                            className="rounded"
                          />
                          人が集まりそう
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={idea.adminChecklist?.manageable || false}
                            onChange={(e) => idea.id && updateAdminChecklistHandler(idea.id, {
                              ...idea.adminChecklist,
                              manageable: e.target.checked
                            })}
                            className="rounded"
                          />
                          管理側で対応可能
                        </label>
                      </div>
                    </div>
                    
                    {/* 管理用メモ */}
                    <div className="pt-3 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">管理用メモ（非公開）:</label>
                      <textarea
                        value={idea.adminMemo || ''}
                        onChange={(e) => idea.id && updateAdminMemoHandler(idea.id, e.target.value)}
                        placeholder="管理用メモを入力..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        rows={2}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (idea.id) {
                              alert('メモを保存しました');
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex gap-2 flex-wrap">
                      {idea.status === 'idea' && (
                        <>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'preparing')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            検討中にする
                          </button>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'rejected', '見送り')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            見送り
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('本当に削除しますか？この操作は元に戻せません。')) {
                                idea.id && showDeleteConfirm('idea', idea.id, idea.title)
                              }
                            }}
                            className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                          >
                            削除
                          </button>
                        </>
                      )}
                      
                      {idea.status === 'preparing' && (
                        <>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'idea')}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            未確認に戻す
                          </button>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'event_planned', 'イベント化を決定')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            イベント化予定
                          </button>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'rejected', '見送り')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            見送り
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('本当に削除しますか？この操作は元に戻せません。')) {
                                idea.id && showDeleteConfirm('idea', idea.id, idea.title)
                              }
                            }}
                            className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                          >
                            削除
                          </button>
                        </>
                      )}
                      
                      {idea.status === 'event_planned' && (
                        <>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'preparing')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            検討中に戻す
                          </button>
                          <button
                            onClick={() => idea.id && updateIdeaStatusHandler(idea.id, 'completed', 'イベント実施済み')}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                          >
                            対応済み
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('本当に削除しますか？この操作は元に戻せません。')) {
                                idea.id && showDeleteConfirm('idea', idea.id, idea.title)
                              }
                            }}
                            className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                          >
                            削除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* 削除確認ダイアログ */}
      {deleteConfirm.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {deleteConfirm.type === 'theme' ? 'テーマの削除' : '投稿の削除'}
            </h3>
            <p className="text-gray-700 mb-4">
              「{deleteConfirm.title}」を削除してもよろしいですか？
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                削除理由（任意）
              </label>
              <textarea
                value={deleteConfirm.reason}
                onChange={(e) => setDeleteConfirm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="削除理由を入力してください..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={executeDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                削除する
              </button>
              <button
                onClick={hideDeleteConfirm}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ユーザー管理セクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ユーザー管理</h2>
        
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
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className={`border border-gray-200 rounded-lg p-4 ${selectedUsers.has(user.id!) ? 'bg-red-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id!)}
                    onChange={() => toggleUserSelection(user.id!)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {user.username}
                    </h3>
                    
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>投稿数: {user.postCount}</span>
                      <span>テーマ参加: {user.themeCount}</span>
                      <span>登録日: {user.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                      {user.lastLoginAt && (
                        <span className="text-green-600 font-medium">
                          最終ログイン: {user.lastLoginAt.toDate().toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/user/${user.id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    詳細を見る
                  </Link>
                  <button
                    onClick={() => deleteUserHandler(user.id!, user.username)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <p className="text-gray-500 text-center py-8">ユーザーがまだ登録されていません</p>
          )}
        </div>
      </div>
      
      {/* 削除ログセクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">削除ログ</h2>
        
        <div className="space-y-2">
          {deletionLogs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      log.type === 'user' ? 'bg-red-100 text-red-800' :
                      log.type === 'idea' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {log.type === 'user' ? 'ユーザー' : log.type === 'idea' ? '投稿' : 'テーマ'}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      ID: {log.itemId}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">理由:</span> {log.reason}</p>
                    <p><span className="font-medium">削除者:</span> {log.deletedBy}</p>
                    <p><span className="font-medium">日時:</span> {log.deletedAt.toDate().toLocaleString('ja-JP')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {deletionLogs.length === 0 && (
            <p className="text-gray-500 text-center py-8">削除ログがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
