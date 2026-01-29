import { PageWrapper } from '@/components/layout/PageWrapper';

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageWrapper>{children}</PageWrapper>;
}
