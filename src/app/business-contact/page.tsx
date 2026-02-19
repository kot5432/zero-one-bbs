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
    phone: '',
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
        phone: formData.phone.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
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
          <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">お問い合わせの中のビジネス関連</span>
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">困っていることを教えてください</h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            技術的問題、利用方法、アカウント関連など、サポートチームがお答えします。
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 会社名 */}
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-bold text-slate-700 ml-1">
                  会社名 / 団体名
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="例：株式会社Buildea"
                />
              </div>

              {/* 担当者名 */}
              <div className="space-y-2">
                <label htmlFor="contactName" className="block text-sm font-bold text-slate-700 ml-1">
                  担当者名
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="例：山田 太郎"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

              {/* 電話番号 */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-bold text-slate-700 ml-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="例：03-1234-5678"
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
                <option value="partnership">提携・協力について</option>
                <option value="advertising">広告掲載について</option>
                <option value="investment">投資・出資について</option>
                <option value="media">メディア取材について</option>
                <option value="other_business">その他ビジネス関連</option>
              </select>
            </div>

            {/* メッセージ */}
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
                placeholder="例）弊社サービスとの提携につきまして、詳細をお聞きしたいと思っております。..."
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
