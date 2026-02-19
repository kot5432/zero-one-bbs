'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function BusinessContactPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    subject: '',
    message: '',
    companyUrl: '',
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
    if (!formData.companyName.trim()) {
      setError('会社名・団体名を教えてください');
      setLoading(false);
      return;
    }

    if (!formData.contactName.trim()) {
      setError('担当者名を教えてください');
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
      setError('ご提案内容を教えてください');
      setLoading(false);
      return;
    }

    try {
      const businessContactData = {
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        companyUrl: formData.companyUrl.trim(),
        status: 'pending',
        type: 'business',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'businessContacts'), businessContactData);

      const notificationData = {
        title: 'ビジネス関連のお問い合わせ',
        message: `${formData.companyName}の${formData.contactName}様から「${formData.subject}」に関するお問い合わせがありました。`,
        type: 'business',
        link: `/admin/business-contacts/${docRef.id}`,
        isRead: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notificationData);

      setSubmitted(true);
    } catch (err) {
      console.error('Business contact form error:', err);
      setError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-orange-100"
          >
            <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3">
              <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">ご提案ありがとうございます</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              内容を拝見し、担当より折り返しご連絡いたします。<br />
              貴社との素晴らしいご縁を楽しみにしております。
            </p>
            <Link
              href="/"
              className="inline-block px-10 py-5 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-200"
            >
              トップページに戻る
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold mb-4">お問い合わせの中のビジネス関連</span>
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">新しい価値を、共に。</h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            本サービスは、オンラインのアイデアをオフラインイベントとして実現することを目的としています。<br />
            どのような形でご一緒できそうか、ぜひ教えてください。
          </p>
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-indigo-900 text-sm">
              💡 <strong>技術的問題・利用方法など</strong>に関するお問い合わせは
              <Link href="/contact" className="ml-1 font-bold underline decoration-2 underline-offset-4 hover:text-indigo-700">
                こちら
              </Link>
              からお願いします。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-16 border border-slate-100">
          {error && (
            <div className="mb-10 p-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center font-bold">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* 会社名 */}
              <div className="space-y-3">
                <label htmlFor="companyName" className="block text-sm font-black text-slate-800 ml-1">
                  会社名 / 団体名
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-bold text-lg"
                  placeholder="株式会社Buildea"
                />
              </div>

              {/* 担当者名 */}
              <div className="space-y-3">
                <label htmlFor="contactName" className="block text-sm font-black text-slate-800 ml-1">
                  担当者名
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-bold text-lg"
                  placeholder="山田 太郎"
                />
              </div>
            </div>

            {/* メールアドレス */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-black text-slate-800 ml-1">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-bold text-lg"
                placeholder="office@example.com"
              />
            </div>

            {/* 件名 */}
            <div className="space-y-3">
              <label htmlFor="subject" className="block text-sm font-black text-slate-800 ml-1">
                お問い合わせ種別
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-lg appearance-none cursor-pointer"
              >
                <option value="">選択してください</option>
                <option value="partnership">提携について</option>
                <option value="collaboration">協力のご相談</option>
                <option value="advertising">広告掲載</option>
                <option value="other_business">その他</option>
              </select>
            </div>

            {/* 会社URL (任意) */}
            <div className="space-y-3">
              <label htmlFor="companyUrl" className="block text-sm font-black text-slate-800 ml-1">
                会社URL <span className="text-slate-400 font-medium ml-2">(任意)</span>
              </label>
              <input
                type="url"
                id="companyUrl"
                name="companyUrl"
                value={formData.companyUrl}
                onChange={handleChange}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-bold text-lg"
                placeholder="https://example.com"
              />
            </div>

            {/* 内容 */}
            <div className="space-y-3">
              <label htmlFor="message" className="block text-sm font-black text-slate-800 ml-1">
                ご提案内容
              </label>
              <div className="relative group">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={8}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-bold text-lg resize-none"
                  placeholder={`例）\n・オフラインイベント会場提供\n・スポンサー協力\n・共催企画のご相談\n\n具体的な内容やメリットを教えてください。`}
                />
              </div>
            </div>

            {/* 資料添付シミュレーション (UIのみ) */}
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-center hover:border-orange-400 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-100 transition-colors">
                <svg className="w-6 h-6 text-slate-500 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-black text-slate-700">資料を添付する</p>
              <p className="text-xs text-slate-400 mt-1">PDF / PPTX (最大 10MB)</p>
            </div>

            {/* 送信ボタン */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xl flex items-center justify-center space-x-4 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>内容を送信中...</span>
                  </>
                ) : (
                  <>
                    <span>この内容で提案する</span>
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* フッターリンク */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
          <Link href="/" className="text-slate-500 font-bold hover:text-slate-900 transition-colors">
            ← トップページ
          </Link>
          <Link href="/contact" className="text-slate-500 font-bold hover:text-slate-900 transition-colors">
            一般のお問い合わせ
          </Link>
          <div className="text-slate-400 text-sm font-medium">
            X: @kto_543
          </div>
        </div>
      </main>
    </div>
  );
}
