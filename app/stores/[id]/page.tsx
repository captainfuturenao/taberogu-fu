import prisma from '@/lib/prisma';
import { ReviewCard } from '@/components/features/review/ReviewCard';
import { ReviewForm } from '@/components/features/review/ReviewForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Clock, Globe, Star, Info } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StoreDetailPage({
    params
}: {
    params: { id: string }
}) {
    const store = await prisma.store.findUnique({
        where: { id: params.id },
        include: {
            reviews: {
                where: { isDeleted: false },
                orderBy: { createdAt: 'desc' },
            }
        }
    });

    if (!store || store.isDeleted) {
        notFound();
    }

    const reviewCount = store.reviews.length;
    const averageRating = reviewCount > 0
        ? store.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {store.name}
                            {store.genre && <Badge variant="secondary" className="text-base">{store.genre}</Badge>}
                        </h1>
                        <div className="flex items-center mt-2 space-x-4">
                            <div className="flex items-center text-yellow-500 font-bold text-xl">
                                <Star className="h-5 w-5 mr-1 fill-current" />
                                {averageRating.toFixed(1)}
                            </div>
                            <span className="text-muted-foreground">
                                口コミ {reviewCount}件
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/stores/${store.id}/edit`}>店舗情報の編集</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center">
                            <Info className="h-5 w-5 mr-2" />
                            店舗情報
                        </h2>
                        <dl className="space-y-4 text-sm">
                            <div className="flex">
                                <dt className="w-24 font-medium flex-shrink-0 flex items-center text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2" /> 住所
                                </dt>
                                <dd>{store.address}</dd>
                            </div>
                            <div className="flex">
                                <dt className="w-24 font-medium flex-shrink-0 flex items-center text-muted-foreground">
                                    <Phone className="h-4 w-4 mr-2" /> 電話
                                </dt>
                                <dd>{store.phone || '-'}</dd>
                            </div>
                            <div className="flex">
                                <dt className="w-24 font-medium flex-shrink-0 flex items-center text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-2" /> 営業時間
                                </dt>
                                <dd className="whitespace-pre-wrap">{store.businessHours || '-'}</dd>
                            </div>
                            <div className="flex">
                                <dt className="w-24 font-medium flex-shrink-0 flex items-center text-muted-foreground">
                                    <Globe className="h-4 w-4 mr-2" /> URL
                                </dt>
                                <dd>
                                    {store.websiteUrl ? (
                                        <a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                                            {store.websiteUrl}
                                        </a>
                                    ) : '-'}
                                </dd>
                            </div>
                        </dl>
                    </section>
                    {store.description && (
                        <section className="space-y-2">
                            <h3 className="font-semibold">お店のPR・紹介</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {store.description}
                            </p>
                        </section>
                    )}
                </div>

                {/* Review Form (Top on mobile, side on desktop?) -- Actually usually below. Requirement: "店舗詳細でレビュー投稿でき" */}
                {/* Let's put Review Form below details or to the side. The layout above is grid-cols-2, let's keep details in one col for now, maybe map in second col if we had one.
                Actually detailed info takes space. Let's make Info full width for now or keep generic.
            */}
            </div>

            <Separator />

            {/* Reviews Section */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold">口コミ一覧</h2>

                <div className="grid grid-cols-1 gap-6">
                    {store.reviews.length === 0 ? (
                        <p className="text-muted-foreground">まだ口コミはありません。最初の投稿者になりましょう！</p>
                    ) : (
                        store.reviews.map((review) => (
                            <div key={review.id} className="relative group">
                                <ReviewCard review={review} />
                                {/* Edit Link could go here if we want easily, but we need key. 
                                Maybe a small "edit" button that asks for key in a dialog?
                                Requirement: "レビュー削除（論理削除）... 編集キー一致の場合のみ".
                                Implementation: Link to /reviews/[id]/edit page or dialog.
                                Let's add a small link/icon.
                            */}
                            </div>
                        ))
                    )}
                </div>

                {/* Form */}
                <ReviewForm storeId={store.id} />
            </div>
        </div>
    );
}
