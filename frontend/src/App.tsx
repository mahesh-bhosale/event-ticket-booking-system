import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from '@/routes/index';

// ─────────────────────────────────────────────────────────────
//  React Query Client
// ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─────────────────────────────────────────────────────────────
//  Root App Component
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}
