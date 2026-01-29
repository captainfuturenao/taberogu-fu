import prisma from '@/lib/prisma';
import { ReviewCard } from '@/components/features/review/ReviewCard';
import { SearchForm } from '@/components/features/store/SearchForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const recentReviews = await prisma.review.findMany({
    where: { isDeleted: false },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: { store: true },
  });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 py-24 rounded-lg overflow-hidden">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-shadow-lg">
            気になるお店を、<br />みんなのレビューで見つけよう。
          </h1>
          <p className="text-lg text-gray-100 mb-8 font-medium text-shadow">
            登録不要で、誰でも自由に投稿・閲覧できるオープンなグルメサイトです。
          </p>
          <div className="flex justify-center max-w-xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Genre Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">ジャンルから探す</h2>
        <div className="flex flex-wrap gap-3">
          {['ラーメン', '焼肉', '寿司', 'カフェ', '居酒屋', 'イタリアン', '中華', '和食', '洋食', 'フレンチ', 'バー'].map((genre) => (
            <Button key={genre} variant="secondary" className="rounded-full" asChild>
              <Link href={`/stores?query=${encodeURIComponent(genre)}`}>
                {genre}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">新着レビュー</h2>
        </div>

        {recentReviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">まだレビューはありません。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showStoreName />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
