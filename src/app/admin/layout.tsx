import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Админ-панель | СПОРТ ТЕХ',
    description: 'Панель управления',
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-muted/40 text-foreground admin-layout">
            {children}
        </div>
    )
}
