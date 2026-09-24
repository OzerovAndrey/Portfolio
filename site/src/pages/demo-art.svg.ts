// Спрайт ілюстрацій демо для лобі-мокапу (статичний файл при білді, кешується, не роздуває HTML).
// Зовнішній <use href="…/demo-art.svg#ill-…"> успадковує CSS-змінні від <use>, тож арт перефарбовується брендом.
import type { APIRoute } from "astro";
import { LOBBY_ART, artSprite, illustration } from "../lib/stage";

export const GET: APIRoute = () => {
  const j = illustration("jackpot");
  const body = artSprite(LOBBY_ART.map((a) => a.ill), j.body) + `<symbol id="ill-jackpot" viewBox="0 0 ${j.w} ${j.h}">${j.body}</symbol>`;
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`, { headers: { "Content-Type": "image/svg+xml" } });
};
