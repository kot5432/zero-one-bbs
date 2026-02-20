'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ブランドセクション */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <h3 className="text-xl font-bold">
                Buildea
              </h3>
            </div>
            <p className="text-gray-300 text-base leading-relaxed">
              創造的なアイデアを形にするプラットフォーム
            </p>
            <div className="flex space-x-3">
              <a
                href="https://twitter.com/kto_543"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-2xl flex items-center justify-center hover:bg-gray-700 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* サービスセクション */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold mb-5 text-white">サービス</h3>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/ideas" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                  アイデア一覧
                </Link>
              </li>
              <li>
                <Link href="/post/select" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                  投稿する
                </Link>
              </li>
            </ul>
          </div>

          {/* サポートセクション */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold mb-5 text-white">サポート</h3>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                  ログイン
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                  アカウント作成
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                  Buildeaについて
                </Link>
              </li>
            </ul>
          </div>

          {/* お問い合わせセクション */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold mb-5 text-white">お問い合わせ</h3>
            <p className="text-gray-300 text-base mb-6 leading-relaxed">
              ご質問やご要望がございましたら、お気軽にお問い合わせください。
            </p>
            <div className="space-y-3">
              <Link
                href="/contact"
                className="group flex items-center px-5 py-3 bg-gray-800 text-white rounded-2xl hover:bg-blue-600 transition-all hover:scale-105 justify-center shadow-lg"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mr-3 group-hover:bg-white transition-colors">
                  <svg className="w-5 h-5 text-white group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base mb-1">技術的なお問い合わせ</div>
                  <div className="text-xs text-gray-300">技術的問題・利用方法など</div>
                </div>
              </Link>
              <Link
                href="/business-contact"
                className="group flex items-center px-5 py-3 bg-gray-800 text-white rounded-2xl hover:bg-green-600 transition-all hover:scale-105 justify-center shadow-lg"
              >
                <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center mr-3 group-hover:bg-white transition-colors">
                  <svg className="w-5 h-5 text-white group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base mb-1">ビジネスに関するお問い合わせ</div>
                  <div className="text-xs text-gray-300">提携・広告など</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* コピーライトセクション */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-5">
              <p className="text-gray-400 text-base">
                &copy; 2024 Buildea. All rights reserved.
              </p>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-gray-400 text-sm">System Online</span>
              </div>
            </div>
            <div className="flex space-x-6 text-base">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                利用規約
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                サイトマップ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
