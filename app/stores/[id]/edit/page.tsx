import prisma from '@/lib/prisma';
import { StoreForm } from '@/components/features/store/StoreForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditStorePage({
    params
}: {
    params: { id: string }
}) {
    const store = await prisma.store.findUnique({
        where: { id: params.id },
    });

    if (!store || store.isDeleted) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">店舗情報の編集</h1>
                <p className="text-muted-foreground mt-2">
                    店舗情報を更新します。登録時の編集キーが必要です。
                </p>
            </div>
            <StoreForm initialData={store} isEdit />
        </div>
    );
}
