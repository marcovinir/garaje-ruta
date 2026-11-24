/**
 * `next/navigation` falso para las pruebas del panel (fuera de Next no hay router). Se registra
 * en `vitest.setup.ts`; una prueba que necesite otra cosa hace su propio `vi.mock`.
 */
import { vi } from "vitest";

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const navegacion = {
  pathname: "/panel/articulos",
  busqueda: new URLSearchParams(),
  parametros: {} as Record<string, string>,
};

export function irA(pathname: string, busqueda = "", parametros: Record<string, string> = {}) {
  navegacion.pathname = pathname;
  navegacion.busqueda = new URLSearchParams(busqueda);
  navegacion.parametros = parametros;
}

export function reiniciarNavegacion() {
  Object.values(router).forEach((f) => f.mockReset());
  irA("/panel/articulos");
}

export const moduloNavegacion = {
  useRouter: () => router,
  usePathname: () => navegacion.pathname,
  useSearchParams: () => navegacion.busqueda,
  useParams: () => navegacion.parametros,
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (ruta: string) => {
    throw new Error(`REDIRECT ${ruta}`);
  },
  permanentRedirect: (ruta: string) => {
    throw new Error(`REDIRECT ${ruta}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && /^(NOT_FOUND|REDIRECT)/.test(error.message)) throw error;
  },
};
