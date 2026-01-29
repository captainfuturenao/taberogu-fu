import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

export function Header() {
    return (
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80">
                    <Store className="h-6 w-6 text-primary" />
                    <span>ReviewApp</span>
                </Link>

                <nav className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/stores">店舗一覧</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/stores/new">店舗登録</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
