import { afterEach, expect, it, vi } from "vitest";

import { registrarEvento } from "./eventos";

afterEach(() => vi.unstubAllGlobals());

it("envía un POST que puede continuar al salir y omite credenciales y referente", () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetch);
  registrarEvento("whatsapp_click", {
    articulo: 13,
    contexto: { pagina: "ficha_auto", seccion: "ficha" },
  });

  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/eventos/",
    expect.objectContaining({
      method: "POST",
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    }),
  );
  const cuerpo = JSON.parse(fetch.mock.calls[0][1].body);
  expect(cuerpo).toEqual({
    tipo: "whatsapp_click",
    articulo: 13,
    contexto: { pagina: "ficha_auto", seccion: "ficha" },
    dispositivo: "escritorio",
  });
});

it("no lanza ni rechaza si el envío falla", async () => {
  const fetch = vi
    .fn()
    .mockImplementationOnce(() => {
      throw new Error("falló el envío");
    })
    .mockRejectedValueOnce(new Error("no hay red"));
  vi.stubGlobal("fetch", fetch);
  expect(() => registrarEvento("offer_view")).not.toThrow();
  expect(() => registrarEvento("offer_view")).not.toThrow();
  await Promise.resolve();
});
