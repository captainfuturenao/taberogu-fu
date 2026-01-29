import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import { Store } from '@prisma/client';

type StoreWithStats = Store & {
    reviewCount?: number;
    averageRating?: number;
};

export function StoreCard({ store }: { store: StoreWithStats }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">
                        <Link href={`/stores/${store.id}`} className="hover:underline">
                            {store.name}
                        </Link>
                    </CardTitle>
                    {store.genre && <Badge variant="secondary">{store.genre}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{store.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center text-yellow-500 font-bold">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        {store.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <span className="text-muted-foreground text-xs">
                        ({store.reviewCount || 0}件)
                    </span>
                </div>
                {store.description && (
                    <p className="line-clamp-2 text-muted-foreground mt-2">
                        {store.description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
