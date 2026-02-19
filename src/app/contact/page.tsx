'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    url: '',
    device: '',
    browser: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // バリデーション
    if (!formData.name.trim()) {
      setError('お名前を教えてください');
      setLoading(false);
      return;
    }

    if (!formData.email.trim() || !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('有効なメールアドレスを入力してください');
      setLoading(false);
      return;
    }

    if (!formData.subject) {
      setError('お問い合わせの種類を選んでください');
      setLoading(false);
      return;
    }

    if (!formData.message.trim()) {
      setError('詳しい内容を教えてください');
      setLoading(false);
      return;
    }

    try {
      const contactData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        url: formData.subject === 'technical' ? formData.url : '',
        device: formData.subject === 'technical' ? formData.device : '',
        browser: formData.subject === 'technical' ? formData.browser : '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'contacts'), contactData);

      const notificationData = {
        title: '新しいお問い合わせ',
        message: `${formData.name}さんから「${formData.subject}」に関するお問い合わせがありました。`,
        type: 'contact',
        link: `/admin/contacts/${docRef.id}`,
        isRead: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notificationData);

      setSubmitted(true);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">お問い合わせを受け付けました</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              内容を確認のうえ、担当者よりご連絡いたします。<br />
              いましばらくお待ちくださいませ。
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              トップページに戻る
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-900">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">困っていることを教えてください</h1>
          <p className="text-lg text-slate-600 font-medium mb-4">
            技術的問題、利用方法、アカウント関連など、サポートチームがお答えします。
          </p>
          <p className="text-lg text-slate-700 font-medium mb-6">
            あなたのアイデアを、一緒に形に。<br />
            投稿から実績化まで、伴走します。
          </p>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-indigo-900 text-sm">
              💡 <strong>ビジネス関連のお問い合わせ</strong>（提携・広告など）は
              <Link href="/business-contact" className="ml-1 font-bold underline decoration-2 underline-offset-4 hover:text-indigo-700">
                こちら
              </Link>
              からお願いします。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-200/60 backdrop-blur-sm">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center font-medium"
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* お名前 */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 ml-1">
                  お名前
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="例：山田 太郎"
                />
              </div>

              {/* メールアドレス */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 ml-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* 件名 */}
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-bold text-slate-700 ml-1">
                お問い合わせの種類
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">選択してください</option>
                <option value="technical">技術的問題（エラーが出る・動かないなど）</option>
                <option value="usage">利用方法（使い方がわからないなど）</option>
                <option value="account">アカウント関連（ログイン・登録解除など）</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* 条件分岐フィールド: 技術的問題の場合 */}
            <AnimatePresence>
              {formData.subject === 'technical' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-2 overflow-hidden"
                >
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                      <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold uppercase tracking-wider">Additional details</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="url" className="block text-xs font-bold text-slate-500 ml-1 uppercase">
                          発生しているページのURL
                        </label>
                        <input
                          type="text"
                          id="url"
                          name="url"
                          value={formData.url}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-sm"
                          placeholder="https://buildea.com/..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="device" className="block text-xs font-bold text-slate-500 ml-1 uppercase">
                            使用端末
                          </label>
                          <input
                            type="text"
                            id="device"
                            name="device"
                            value={formData.device}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-sm"
                            placeholder="例：iPhone 15 / Windows PC"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="browser" className="block text-xs font-bold text-slate-500 ml-1 uppercase">
                            ブラウザ
                          </label>
                          <input
                            type="text"
                            id="browser"
                            name="browser"
                            value={formData.browser}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-sm"
                            placeholder="例：Chrome / Safari"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 内容 */}
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-bold text-slate-700 ml-1">
                詳しい内容
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                placeholder={`例）ログイン後、マイページが表示されません。\n発生した状況や、表示されたエラーメッセージなどをご記入ください。`}
              />
            </div>

            {/* 送信ボタン */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>送信中...</span>
                  </>
                ) : (
                  <>
                    <span>メッセージを送る</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* フッターリンク */}
        <div className="mt-12 flex flex-col items-center space-y-6 text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            ← トップページに戻る
          </Link>
          <div className="flex items-center space-x-6 text-sm">
            <span>お問い合わせ：@kto_543 (X)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
