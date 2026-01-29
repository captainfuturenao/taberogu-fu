import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star, User, Clock } from 'lucide-react';
import { Review, Store } from '@prisma/client';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type ReviewWithStore = Review & {
    store?: Store;
};

export function ReviewCard({ review, showStoreName = false }: { review: ReviewWithStore, showStoreName?: boolean }) {
    return (
        <Card>
            <CardHeader className="pb-2 space-y-1">
                <div className="flex justify-between items-center">
                    {showStoreName && review.store ? (
                        <div className="font-bold text-sm truncate">
                            {review.store.name}
                        </div>
                    ) : (
                        <div className="font-semibold text-sm flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {review.authorName || '匿名'}
                        </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), 'yyyy/MM/dd', { locale: ja })}
                    </span>
                </div>
                <div className="flex items-center text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                        />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p className="whitespace-pre-wrap leading-relaxed">{review.body}</p>
                {review.visitedAt && (
                    <div className="flex items-center text-xs text-muted-foreground pt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        訪問日: {format(new Date(review.visitedAt), 'yyyy/MM/dd', { locale: ja })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
