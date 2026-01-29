'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, Trash2 } from 'lucide-react';
import { Review } from '@prisma/client';
import { format } from 'date-fns';

const formSchema = z.object({
    rating: z.string().min(1, '評価を選択してください'),
    body: z.string().min(10, '本文は10文字以上で入力してください').max(1000, '本文は1000文字以内で入力してください'),
    authorName: z.string().max(30, '名前は30文字以内で入力してください').optional(),
    visitedAt: z.string().optional(),
    editKey: z.string().optional(),
});

type ReviewFormProps = {
    storeId?: string;
    initialData?: Review;
    isEdit?: boolean;
};

export function ReviewForm({ storeId, initialData, isEdit = false }: ReviewFormProps) {
    const router = useRouter();
    const [editKey, setCreatedKey] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rating: initialData?.rating.toString() || '',
            body: initialData?.body || '',
            authorName: initialData?.authorName || '',
            visitedAt: initialData?.visitedAt && initialData.visitedAt instanceof Date
                ? format(initialData.visitedAt, 'yyyy-MM-dd')
                : (initialData?.visitedAt ? format(new Date(initialData.visitedAt), 'yyyy-MM-dd') : ''),
            editKey: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const url = isEdit ? `/api/reviews/${initialData?.id}` : `/api/stores/${storeId}/reviews`;
            const method = isEdit ? 'PATCH' : 'POST';

            const body = { ...values };
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
                throw new Error(data.error || 'Failed to submit review');
            }

            if (isEdit) {
                toast.success('レビューを更新しました');
                router.push(data.review?.storeId ? `/stores/${data.review.storeId}` : '/stores');
                router.refresh();
            } else {
                setCreatedKey(data.editKey);
                toast.success('レビューを投稿しました');
                form.reset();
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || 'レビューの投稿に失敗しました');
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
            const res = await fetch(`/api/reviews/${initialData?.id}?key=${key}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            toast.success('レビューを削除しました');
            router.push(initialData?.storeId ? `/stores/${initialData.storeId}` : '/stores');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || '削除に失敗しました');
        }
    };

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>{isEdit ? 'レビューの編集' : 'レビューを投稿する'}</CardTitle>
                {isEdit && <CardDescription>編集キーを入力して内容を更新または削除できます。</CardDescription>}
            </CardHeader>
            <CardContent>
                {editKey ? (
                    <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/10">
                        <Terminal className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-600 font-bold">投稿完了！編集キーを保存してください</AlertTitle>
                        <AlertDescription className="mt-2 text-green-700">
                            <p className="mb-2">このキーがないと、後でレビューを編集・削除できません。</p>
                            <div className="flex items-center gap-2 p-2 bg-background border rounded">
                                <code className="font-mono flex-1">{editKey}</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        navigator.clipboard.writeText(editKey);
                                        toast.success('コピーしました');
                                    }}
                                >
                                    コピー
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : (
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
                                                <Input type="password" placeholder="投稿時に発行されたキー" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="rating"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>評価 <span className="text-red-500">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選択してください" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {[5, 4, 3, 2, 1].map((num) => (
                                                        <SelectItem key={num} value={num.toString()}>
                                                            {'★'.repeat(num)} ({num})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="visitedAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>訪問日</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="authorName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>お名前 (任意)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="匿名希望" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="body"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>本文 (10文字以上) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="お店の雰囲気や料理の感想を書いてください..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-between items-center pt-4">
                                {isEdit ? (
                                    <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        削除する
                                    </Button>
                                ) : <div></div>}

                                <Button type="submit" size="lg">{isEdit ? '更新する' : '投稿する'}</Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
