import prisma from '@/lib/prisma';
import { StoreCard } from '@/components/features/store/StoreCard';
import { SearchForm } from '@/components/features/store/SearchForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StoresPage({
    searchParams,
}: {
    searchParams: { page?: string; query?: string; limit?: string }
}) {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '12'); // 3 cols x 4 rows
    const query = searchParams.query || '';
    const skip = (page - 1) * limit;

    // Build Filter
    const where: any = {
        isDeleted: false,
    };

    if (query) {
        where.OR = [
            { name: { contains: query } },
            { address: { contains: query } },
            { genre: { contains: query } },
        ];
    }

    const [stores, total] = await Promise.all([
        prisma.store.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                reviews: {
                    select: { rating: true },
                    where: { isDeleted: false },
                },
            },
        }),
        prisma.store.count({ where }),
    ]);

    // Calculate stats
    const storesWithStats = stores.map((store) => {
        const validReviews = store.reviews;
        const count = validReviews.length;
        const avg = count > 0
            ? validReviews.reduce((acc, r) => acc + r.rating, 0) / count
            : 0;

        return {
            ...store,
            reviewCount: count,
            averageRating: avg,
        };
    });

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">店舗一覧</h1>
            </div>

            <div>
                <SearchForm />
            </div>

            {storesWithStats.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">
                    条件に一致する店舗は見つかりませんでした。
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {storesWithStats.map((store) => (
                        <StoreCard key={store.id} store={store} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        disabled={page <= 1}
                        asChild={page > 1}
                    >
                        {page > 1 ? (
                            <Link href={`/stores?page=${page - 1}&query=${query}`}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                前へ
                            </Link>
                        ) : (
                            <span>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                前へ
                            </span>
                        )}
                    </Button>
                    <span className="text-sm font-medium">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        asChild={page < totalPages}
                    >
                        {page < totalPages ? (
                            <Link href={`/stores?page=${page + 1}&query=${query}`}>
                                次へ
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                        ) : (
                            <span>
                                次へ
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
