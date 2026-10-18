# Slide Puzzle Pro (PWA + APK)

Jogo de puzzle deslizante (15 puzzle). Versão **1.1.0** — 18/10/2026.
Desenvolvido por: Willian R Rocha — willian.wrr1@gmail.com

## Publicar como site (GitHub Pages)
Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Gerar o APK (offline, atualizável)
1. Gere a chave uma única vez e guarde um backup:
   `keytool -genkeypair -v -keystore release.jks -alias slidepuzzle -keyalg RSA -keysize 2048 -validity 10000`
2. Converta para base64 (`base64 -w0 release.jks`) e crie em Settings → Secrets → Actions:
   `KEYSTORE_BASE64`, `KS_PASS`, `KEY_PASS`, `KEY_ALIAS`.
3. Aba Actions → "Build APK" → Run workflow. Baixe o APK em Artifacts.
4. Instale no celular (permitir apps desconhecidos).

## Atualizações sem desinstalar
Mesmo pacote (`com.willianrocha.slidepuzzle`), mesma chave e `versionCode` maior (automático via número da execução).
Ao lançar versão nova: altere `APP_VERSION`/`APP_DATE` em `app.js`, a versão em `package.json` e o cache em `sw.js`; rode o workflow e instale por cima.

## Histórico
- 1.1.0 (18/10/2026): Top 10 por modo/tamanho; empacotamento APK (Capacitor + GitHub Actions)
- 1.0.0 (06/10/2026): versão inicial
