/**
 * Perfil ativo neste aparelho. Sem login, guardamos só o id do perfil escolhido
 * ("Sou o fulano") no localStorage — cada um do casal escolhe uma vez no seu celular/PC.
 */
const KEY = "casal:profile-id";

export function getStoredProfileId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredProfileId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* localStorage indisponível (modo privado): o usuário escolhe de novo na próxima visita */
  }
}

export function clearStoredProfileId() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
