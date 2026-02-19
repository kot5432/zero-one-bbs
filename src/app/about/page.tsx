import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Buildea</h1>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                トップ
              </Link>
              <Link href="/post" className="text-gray-700 hover:text-gray-900">
                投稿
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Buildeaとは？</h2>

          <div className="space-y-8">
            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">🚀 概要</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Buildeaは、学生のアイデアを形にするためのプラットフォームです。
                「0」の状態から「1」を生み出す挑戦を応援します。
                新しいサービス、イベント、プロジェクトのきっかけをここから始めましょう。
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">🎯 目的</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">アイデアの共有</h4>
                    <p className="text-gray-700">
                      学生が持つ斬新なアイデアを簡単に共有し、多くの人に届ける
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">共感と協力</h4>
                    <p className="text-gray-700">
                      共感を集め、同じ志を持つ仲間を見つけて協力関係を築く
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">実現への第一歩</h4>
                    <p className="text-gray-700">
                      アイデアから具体的な行動へ、実現への道筋をサポートする
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">📖 使い方</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">1</span>
                  <p className="text-gray-700">
                    <strong>アイデアを投稿：</strong>タイトルと内容を入力してアイデアを共有
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">2</span>
                  <p className="text-gray-700">
                    <strong>共感を集める：</strong>👍ボタンでアイデアに共感を表現
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">3</span>
                  <p className="text-gray-700">
                    <strong>コメントで交流：</strong>短いコメントで意見や感想を交換
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">4</span>
                  <p className="text-gray-700">
                    <strong>実現に動く：</strong>「実現に動きたい」で協力の意思を表示
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">❓ なぜ作った？</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                学生時代には多くの素晴らしいアイデアが生まれます。しかし、その多くは
                「誰かに話してみたいけど、タイミングがわからない」「実現したいけど、
                仲間が見つからない」という理由で消えていってしまいます。
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Buildeaは、そんな学生のアイデアが「0」から「1」へと進化するための
                プラットフォームです。気軽にアイデアを投稿し、共感してくれる仲間と出会い、
                実際に行動を起こすきっかけを作る。そんな場所を目指しています。
              </p>
            </section>

            <section className="bg-blue-50 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">さあ、始めましょう！</h3>
              <p className="text-gray-700 mb-6">
                あなたのアイデアが、誰かの心を動かし、新しい何かを生み出すかもしれません。
              </p>
              <Link
                href="/post"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                最初のアイデアを投稿する
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
