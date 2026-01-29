import { StoreForm } from '@/components/features/store/StoreForm';

export default function NewStorePage() {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">店舗登録</h1>
                <p className="text-muted-foreground mt-2">
                    新しいお店を登録します。登録後に発行される編集キーがあれば、後から情報を修正できます。
                </p>
            </div>
            <StoreForm />
        </div>
    );
}
