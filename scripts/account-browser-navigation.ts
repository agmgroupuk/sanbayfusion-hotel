// Test harness only: account forms still call the real authenticated API handler.
export const useRouter = () => ({ refresh() {}, push(path: string) { window.location.assign(path); }, prefetch() {} });
export const usePathname = () => window.location.pathname;
export const useSearchParams = () => new URLSearchParams(window.location.search);
