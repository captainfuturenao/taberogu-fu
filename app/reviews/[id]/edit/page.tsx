import prisma from '@/lib/prisma';
import { ReviewForm } from '@/components/features/review/ReviewForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditReviewPage({
    params
}: {
    params: { id: string }
}) {
    const review = await prisma.review.findUnique({
        where: { id: params.id },
    });

    if (!review || review.isDeleted) {
        notFound();
    }

    const store = await prisma.store.findUnique({
        where: { id: review.storeId },
        select: { name: true, id: true },
    });

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">レビューの編集</h1>
                <p className="text-muted-foreground mt-2">
                    「{store?.name}」へのレビューを編集します。
                </p>
            </div>
            <ReviewForm initialData={review} isEdit />
        </div>
    );
}
