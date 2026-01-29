export function Footer() {
    return (
        <footer className="border-t py-6 bg-muted/30 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} ReviewApp. ローカル検証用アプリケーション
            </div>
        </footer>
    );
}
