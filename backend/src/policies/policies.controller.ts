import { Controller, Get, Param } from "@nestjs/common";
import { PoliciesService } from "./policies.service";

const FALLBACK: Record<string, { title: string; content: string }> = {
  termos: {
    title: "Termos e Condicoes",
    content: "<p>Edite este conteudo no painel administrativo.</p>",
  },
  privacidade: {
    title: "Politica de Privacidade",
    content: "<p>Edite este conteudo no painel administrativo.</p>",
  },
  "jogo-responsavel": {
    title: "Jogo Responsavel",
    content: "<p>Edite este conteudo no painel administrativo.</p>",
  },
};

@Controller("policies")
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get(":key")
  async getPolicy(@Param("key") key: string) {
    const found = await this.policies.findByKey(key);
    const fallback = FALLBACK[key] ?? { title: "Documento", content: "<p>Conteudo nao encontrado.</p>" };
    return {
      key,
      title: found?.title ?? fallback.title,
      content: found?.content ?? fallback.content,
      updatedAt: found?.updatedAt ?? null,
    };
  }
}
