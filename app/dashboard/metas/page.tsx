import { redirect } from 'next/navigation';

// Compatibilidade: links antigos /dashboard/metas → rota canônica /metas
export default function DashboardMetasRedirectPage() {
  redirect('/metas');
}
