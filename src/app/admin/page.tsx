'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { getIdeas, Idea, getThemes, Theme, getActiveTheme, createTheme, updateTheme, getEvents, Event, Timestamp, db, deleteTheme, deleteIdea } from '@/lib/firestore';
import { updateIdeaStatus, updateAdminMemo, updateAdminChecklist } from '@/lib/admin';

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
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
        const [ideasData, themesData, activeThemeData, eventsData] = await Promise.all([
          getIdeas(),
          getThemes(),
          getActiveTheme(),
          getEvents()
        ]);
        setIdeas(ideasData);
        setThemes(themesData);
        setActiveTheme(activeThemeData);
        setEvents(eventsData);
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
          <div className="space-y-4">
            {filteredAndSortedIdeas.map((idea) => (
              <div key={idea.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {idea.title}
                    </h3>
                    {/* イベント化可能度 */}
                    <div className="flex items-center mt-1">
                      <span className="text-xs font-bold text-gray-700 mr-2">イベント化可能度:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-lg ${star <= calculateFeasibilityScore(idea) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-800 mb-2 font-medium">{idea.description}</p>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
                      <span>👍 {idea.likes}</span>
                      <span>{idea.mode === 'online' ? 'オンライン' : 'オフライン'}</span>
                      <span>{idea.createdAt.toDate().toLocaleDateString('ja-JP')}</span>
                    </div>
                    
                    {/* アクション履歴 */}
                    {idea.actionHistory && idea.actionHistory.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <p className="font-bold text-gray-800 mb-1">最近の操作:</p>
                        {idea.actionHistory.slice(-2).map((action, index) => (
                          <div key={index} className="text-gray-700 font-medium">
                            {action.timestamp.toDate().toLocaleDateString('ja-JP')} - {action.details}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(idea.status)}`}>
                      {getStatusText(idea.status)}
                    </span>
                    
                    {/* 次のアクション */}
                    {idea.nextAction && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs max-w-48">
                        <p className="font-medium text-orange-800 mb-1">次のアクション:</p>
                        <p className="text-orange-700">{idea.nextAction}</p>
                      </div>
                    )}
                    
                    {/* 詳細開閉ボタン */}
                    <button
                      onClick={() => toggleIdeaExpansion(idea.id!)}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      {expandedIdeas.has(idea.id!) ? '詳細を閉じる' : '詳細を開く'}
                    </button>
                    
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
                            onClick={() => idea.id && showDeleteConfirm('idea', idea.id, idea.title)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
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
                            onClick={() => idea.id && showDeleteConfirm('idea', idea.id, idea.title)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 管理用チェックリスト */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
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
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">管理用メモ（非公開）:</label>
                  <textarea
                    value={idea.adminMemo || ''}
                    onChange={(e) => idea.id && updateAdminMemoHandler(idea.id, e.target.value)}
                    placeholder="管理用メモを入力..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
                
                {/* 拡張情報（展開時のみ表示） */}
                {expandedIdeas.has(idea.id!) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* 次のアクション設定 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">次のアクション</h4>
                      <select
                        value={idea.nextAction || ''}
                        onChange={(e) => updateIdeaExtendedHandler(idea.id!, { nextAction: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="投稿者に連絡">投稿者に連絡</option>
                        <option value="似たアイデアと統合">似たアイデアと統合</option>
                        <option value="今月は見送り">今月は見送り</option>
                        <option value="次回テーマ候補に保存">次回テーマ候補に保存</option>
                        <option value="詳細検討が必要">詳細検討が必要</option>
                        <option value="実施計画を作成">実施計画を作成</option>
                      </select>
                    </div>
                    
                    {/* 保留理由 */}
                    {idea.status === 'rejected' && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">見送り理由</h4>
                        <select
                          value={idea.rejectionReason || ''}
                          onChange={(e) => updateIdeaExtendedHandler(idea.id!, { rejectionReason: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">選択してください</option>
                          <option value="時期が合わない">時期が合わない</option>
                          <option value="リスクあり">リスクあり</option>
                          <option value="人数不足">人数不足</option>
                          <option value="テーマ外">テーマ外</option>
                          <option value="実施困難">実施困難</option>
                          <option value="類似アイデアあり">類似アイデアあり</option>
                        </select>
                      </div>
                    )}
                    
                    {/* イベント化条件 */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">イベント化条件</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-gray-700 mb-1">👍目標数</label>
                          <input
                            type="number"
                            value={idea.eventFeasibility?.likeTarget || 10}
                            onChange={(e) => updateIdeaExtendedHandler(idea.id!, {
                              eventFeasibility: {
                                likeTarget: parseInt(e.target.value),
                                interestedPeople: idea.eventFeasibility?.interestedPeople || 0,
                                offlinePossible: idea.eventFeasibility?.offlinePossible || false,
                                managementEffort: idea.eventFeasibility?.managementEffort || 'medium',
                                feasibilityScore: idea.eventFeasibility?.feasibilityScore || 0
                              }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">興味を持っている人数</label>
                          <input
                            type="number"
                            value={idea.eventFeasibility?.interestedPeople || 0}
                            onChange={(e) => updateIdeaExtendedHandler(idea.id!, {
                              eventFeasibility: {
                                likeTarget: idea.eventFeasibility?.likeTarget || 10,
                                interestedPeople: parseInt(e.target.value),
                                offlinePossible: idea.eventFeasibility?.offlinePossible || false,
                                managementEffort: idea.eventFeasibility?.managementEffort || 'medium',
                                feasibilityScore: idea.eventFeasibility?.feasibilityScore || 0
                              }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">オフライン実施可否</label>
                          <select
                            value={idea.eventFeasibility?.offlinePossible ? 'true' : 'false'}
                            onChange={(e) => updateIdeaExtendedHandler(idea.id!, {
                              eventFeasibility: {
                                likeTarget: idea.eventFeasibility?.likeTarget || 10,
                                interestedPeople: idea.eventFeasibility?.interestedPeople || 0,
                                offlinePossible: e.target.value === 'true',
                                managementEffort: idea.eventFeasibility?.managementEffort || 'medium',
                                feasibilityScore: idea.eventFeasibility?.feasibilityScore || 0
                              }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="true">可能</option>
                            <option value="false">不可</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">管理工数</label>
                          <select
                            value={idea.eventFeasibility?.managementEffort || 'medium'}
                            onChange={(e) => updateIdeaExtendedHandler(idea.id!, {
                              eventFeasibility: {
                                likeTarget: idea.eventFeasibility?.likeTarget || 10,
                                interestedPeople: idea.eventFeasibility?.interestedPeople || 0,
                                offlinePossible: idea.eventFeasibility?.offlinePossible || false,
                                managementEffort: e.target.value as 'low' | 'medium' | 'high',
                                feasibilityScore: idea.eventFeasibility?.feasibilityScore || 0
                              }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                          </select>
                        </div>
                      </div>
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
    </div>
  );
}
