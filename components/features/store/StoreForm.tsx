'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, Copy, Trash2 } from 'lucide-react';
import { Store } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
    name: z.string().min(1, '店舗名を入力してください').max(80, '80文字以内で入力してください'),
    address: z.string().min(1, '住所を入力してください').max(120, '120文字以内で入力してください'),
    phone: z.string().optional(),
    businessHours: z.string().optional(),
    closedDays: z.string().optional(),
    websiteUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
    genre: z.string().optional(),
    description: z.string().optional(),
    editKey: z.string().optional(),
});

type StoreFormProps = {
    initialData?: Store;
    isEdit?: boolean;
};

export function StoreForm({ initialData, isEdit = false }: StoreFormProps) {
    const router = useRouter();
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || '',
            address: initialData?.address || '',
            phone: initialData?.phone || '',
            businessHours: initialData?.businessHours || '',
            closedDays: initialData?.closedDays || '',
            websiteUrl: initialData?.websiteUrl || '',
            genre: initialData?.genre || '',
            description: initialData?.description || '',
            editKey: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const url = isEdit ? `/api/stores/${initialData?.id}` : '/api/stores';
            const method = isEdit ? 'PATCH' : 'POST';

            const body = { ...values };
            // For create, editKey is not sent or ignored. For edit, it's required.
            if (isEdit && !body.editKey) {
                toast.error('編集キーを入力してください');
                return;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit');
            }

            if (isEdit) {
                toast.success('店舗情報を更新しました');
                router.push(`/stores/${initialData?.id}`);
                router.refresh();
            } else {
                setCreatedKey(data.editKey);
                toast.success('店舗を登録しました');
                form.reset();
                router.refresh();
            }

        } catch (error: any) {
            toast.error(error.message || 'エラーが発生しました');
        }
    }

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;
        const key = form.getValues('editKey');
        if (!key) {
            toast.error('削除するには編集キーを入力してください');
            return;
        }
        try {
            const res = await fetch(`/api/stores/${initialData?.id}?key=${key}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            toast.success('店舗を削除しました');
            router.push('/stores');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || '削除に失敗しました');
        }
    };

    if (createdKey) {
        return (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/10">
                <Terminal className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600 font-bold">登録完了！編集キーを保存してください</AlertTitle>
                <AlertDescription className="mt-4 text-green-700 space-y-4">
                    <p>このキーがないと、後で店舗情報を編集・削除できません。再発行はできないため、必ず控えてください。</p>
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-black border rounded shadow-sm">
                        <code className="font-mono text-lg flex-1 font-bold select-all">{createdKey}</code>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                navigator.clipboard.writeText(createdKey);
                                toast.success('コピーしました');
                            }}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            コピー
                        </Button>
                    </div>
                    <div className="pt-2">
                        <Button asChild variant="link" className="px-0 text-green-700 font-bold">
                            <Link href="/stores">店舗一覧へ戻る</Link>
                        </Button>

                    </div>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {isEdit && (
                    <FormField
                        control={form.control}
                        name="editKey"
                        render={({ field }) => (
                            <FormItem className="bg-muted/50 p-4 rounded-lg border-l-4 border-yellow-500">
                                <FormLabel className="font-bold">編集キー (必須)</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="登録時に発行されたキー" {...field} />
                                </FormControl>
                                <FormDescription>
                                    店舗登録時に発行された編集キーを入力してください。
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>店舗名 <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="例: 焼肉 太郎" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ジャンル</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="選択してください" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {['和食', '洋食', '中華', 'イタリアン', 'フレンチ', 'カフェ', 'バー', 'ラーメン', '焼肉', '寿司', '居酒屋', 'その他'].map((g) => (
                                            <SelectItem key={g} value={g}>
                                                {g}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>住所 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="例: 東京都渋谷区..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>電話番号</FormLabel>
                                <FormControl>
                                    <Input placeholder="例: 03-1234-5678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>公式サイトURL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="businessHours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>営業時間</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="例: ランチ 11:30〜14:00&#13;&#10;ディナー 17:00〜23:00"
                                        className="min-h-[80px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="closedDays"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>定休日</FormLabel>
                                <FormControl>
                                    <Input placeholder="例: 水曜日" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>お店の紹介・メモ</FormLabel>
                            <FormControl>
                                <Textarea placeholder="お店の特徴やおすすめメニューなど" className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-between items-center gap-4">
                    {isEdit ? (
                        <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            削除する
                        </Button>
                    ) : <div></div>}
                    <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>キャンセル</Button>
                        <Button type="submit" size="lg">{isEdit ? '更新する' : '登録する'}</Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
