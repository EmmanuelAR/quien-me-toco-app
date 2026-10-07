# ¿quién me tocó?

amigo secreto (intercambio de regalos anónimo) como pwa instalable en android y iphone, hecha por [ear.dev](https://www.instagram.com/ear.dev/). la "base de datos" es un contrato en starknet sepolia; el login y las wallets son de cavos (google o apple, sin que nadie vea gas ni firmas).

**precio: un follow.** la app no cobra nada. si te sirvió, seguí a [@ear.dev](https://www.instagram.com/ear.dev/) y subí una historia agradeciendo. la app misma te lo recuerda al final.

## costo cero

todo corre en planes gratis y en testnet. nada en este repo apunta a un servicio de pago.

| pieza | servicio | plan gratis | qué pasa si se acerca al límite |
| --- | --- | --- | --- |
| hosting + https + funciones | vercel hobby | funciones hasta 300 s (fluid), 1M invocaciones/mes | la app lee la chain desde el navegador, así que las funciones solo se usan en sorteo, revelación, correos y links privados |
| base de datos | starknet sepolia (testnet) | gas con strk del faucet, rpc público gratis | `network: "testnet"` queda fijo en el código; no hay flag de mainnet |
| login + wallets + gas de usuarios | cavos | gratis hasta 1,000 wallets; paymaster en sepolia gratis e ilimitado | el login hospedado de google/apple evita pagar apple developer program |
| correos | resend | 3,000/mes, 100/día | los que no salen quedan en "mañana" y la admin los reintenta desde el panel |
| kv mínimo | upstash redis | 500k comandos/mes, 256 mb | solo correos, estado de envíos, links privados y locks, todo con ttl |
| fuentes, íconos, imágenes | next/font, png locales, next/og | gratis | sin analytics ni trackers ni cron jobs |

## cómo funciona (en corto)

1. la admin entra con cavos y crea un grupo: nombre, fecha, lugar, presupuesto, cuántos son y reglas.
2. comparte el link por whatsapp (con vista previa). cada persona entra, pone nombre, correo y wishlist. la admin agrega a los que no van a hacer login (la abuela) solo con el nombre.
3. la admin define exclusiones (parejas) y, cuando están todos, hace el sorteo. nadie, ni ella, ve las asignaciones.
4. a cada participante le llega un correo con quién le tocó y en la app lo ve con animación, junto con la wishlist de esa persona siempre actualizada. los sin cuenta reciben un link privado de un solo uso (y qr) que la admin les pasa.
5. el día del intercambio la admin destapa todo: una cadena animada muestra quién le regaló a quién, y "verificá que el sorteo fue justo" comprueba los sellos.

### quién hace qué

- **el contrato** (`contracts/`) es la base de datos y el árbitro: `Open → Closed → DrawRequested → Drawn → RevealRequested → Revealed`. guarda grupos, participantes, wishlists, exclusiones, los sellos del sorteo, los papelitos cifrados y, al final, la permutación con sus salts; verifica que todo coincida antes de revelar.
- **la admin y los participantes** escriben en el contrato con su wallet de cavos (`execute`, gas pagado por el paymaster).
- **el servidor** (rutas en `app/api/`) es un worker sin login: solo actúa cuando el contrato ya está en el estado que pidió la admin. hace el sorteo, cifra cada papelito para quien regala, publica, manda correos y, al revelar, publica la permutación.
- **los sellos**: `commitment_i = poseidon(group_id, i, receiver_i, salt_i)`. sin el salt no dicen nada; al revelar se publican y cualquiera puede recalcularlos. mismo cálculo en `lib/crypto/commitments.ts` y en cairo (hay un test que compara el vector).
- **el cifrado**: sobres x25519 + hkdf + xchacha20-poly1305 (`lib/crypto/sealedbox.ts`). la llave del participante vive en su teléfono (indexeddb); si abre en otro, la app rota la llave y el servidor re-cifra. los sin cuenta se cifran para la llave del servidor.

## estructura

```
app/                 pantallas y rutas (next.js app router)
  i/[id]/[code]      link de invitación (+ vista previa para whatsapp)
  g/[id]             vista del participante · /admin · /revelacion · /verificar · /calendario.ics · /historia
  p/[token]          link privado de los sin cuenta
  api/               workers: draw, reveal, reencrypt, emails, ghost-links, participants/email, ghost/[token]
components/          ui (botón, campo, etiqueta, hoja, íconos, wishlist), cavos, pwa, share, admin, draw, screens
lib/
  brand/             tokens, links, fuentes para next/og
  copy/es-CR.ts      todos los textos (voseo, ortografía normal)
  contract/          abi, lecturas (starknet.js), constructores de llamadas, eventos
  crypto/            sealed box, commitments, correo, llaves locales
  draw/              algoritmo del sorteo (assign.ts) y pipeline de cifrado
  server/            cuenta del servidor, kv, locks, correos, auth de admin, workers
contracts/           contrato cairo + tests (snforge)
emails/              plantillas react email
scripts/             deploy a sepolia, variables del servidor, íconos
tests/               vitest
public/              sw.js, íconos, caritas placeholder
```

## correrlo localmente

requisitos: node 20.9+ (se probó con 24), pnpm, y para el contrato scarb 2.15 + starknet foundry 0.56 (`asdf` o `starkup`).

```bash
pnpm install
cp .env.example .env.local      # llenar lo que tengás; sin kv ni resend igual arranca
pnpm dev                        # http://localhost:3000
pnpm test                       # vitest: sorteo, cifrado, calldata, auth, correo, marca
pnpm typecheck && pnpm lint
cd contracts && snforge test    # 60 tests del contrato
```

sin `NEXT_PUBLIC_CONTRACT_ADDRESS` la app muestra las pantallas pero no puede leer grupos. para probar el flujo completo necesitás el contrato en sepolia y las credenciales de cavos.

## desplegar el contrato en sepolia

1. cuenta del servidor (será el `operator` del contrato y también puede desplegarlo):

   ```bash
   sncast account create --network sepolia --name qmt-server
   ```

   fondeá la dirección que imprime con strk del faucet de sepolia (gratis) y luego:

   ```bash
   sncast account deploy --network sepolia --name qmt-server
   ```

2. declarar y desplegar:

   ```bash
   ACCOUNT=qmt-server ./scripts/deploy-sepolia.sh
   ```

   imprime `NEXT_PUBLIC_CONTRACT_ADDRESS` y `SERVER_STARKNET_ADDRESS`. anotá también el número de bloque para `NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK` (opcional).

3. variables del servidor (llave privada de la cuenta + llave x25519 nueva):

   ```bash
   pnpm tsx scripts/print-server-env.ts qmt-server
   ```

   pegá las líneas en `.env.local` y en vercel. la llave x25519 no se cambia una vez que hay grupos sorteados.

si cambiás el contrato, volvé a correr el deploy y actualizá `lib/contract/abi.json` (`scarb build` y copiar el campo `abi` de `contracts/target/dev/quien_me_toco_QuienMeToco.contract_class.json`).

## conectar cavos

1. creá una app en el dashboard de cavos y copiá `NEXT_PUBLIC_CAVOS_APP_ID` y `NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY` (sepolia).
2. **callback urls** (exactas, una por línea): `http://localhost:3000/auth/callback`, la de cada preview de vercel que uses y la de producción. la app siempre vuelve a `/auth/callback`, así que basta una por dominio.
3. **device approval url**: `https://tu-dominio/approve-device` (la app ya sirve `/approve-device` y `/revoke-device`).
4. **orígenes permitidos** para el vault (donde viven las llaves): tus dominios.
5. `appSalt` es `quien-me-toco` (`lib/env.ts`). no lo cambiés: cada usuario caería en una wallet nueva.

el login de cavos es por redirección (no popup), que es lo que funciona dentro de la pwa instalada. ojo: en iphone, safari y la app instalada tienen almacenamiento separado, así que cavos los trata como dos dispositivos; por eso la app pide "agregame a tu pantalla" antes del login.

## resend y upstash

- **resend**: creá la api key (`RESEND_API_KEY`). para mandar desde `ear.dev`, verificá el dominio (dns) y poné `RESEND_FROM="¿quién me tocó? <hola@ear.dev>"`. mientras tanto sirve `onboarding@resend.dev`.
- **upstash**: creá una base redis (plan gratis) y copiá `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. sin ellas la app usa memoria en proceso (solo para desarrollo: en vercel cada función es efímera).

## vercel

1. importá el repo en vercel (plan hobby). framework: next.js, raíz del repo.
2. pegá todas las variables de `.env.example` con sus valores. `NEXT_PUBLIC_APP_URL` = tu dominio de producción.
3. después del primer deploy, registrá ese dominio en cavos (callback + device approval + orígenes).
4. dominio: `*.vercel.app` gratis o un subdominio de `ear.dev` (cname).

## probar la instalación en el celular

la pwa necesita https: usá la url de vercel (o un túnel como `cloudflared` apuntando a `pnpm dev`).

- **android (chrome)**: abrí la url, esperá el aviso "Agregame a tu pantalla" (o menú → instalar app). se abre sin barras del navegador, con el ícono y el nombre "Quién me tocó".
- **iphone (safari)**: abrí la url, tocá compartir → agregar a inicio. la app muestra los dos pasos cuando detecta iphone. después abrí la app desde la pantalla de inicio y hacé el login ahí (ver nota de cavos arriba). probá también que respete el notch y la barra de abajo.
- **offline**: activá modo avión y abrí la app: debe salir la pantalla "Sin internet".

## textos y marca

- blanco, negro y grises tranquilos (`#1d1d1f`, `#6e6e73`, `#f5f5f7`); el único color es `#0066cc`, solo para links y el anillo de foco.
- letra del sistema (sf en iphone, roboto en android), cuerpo de 17px, títulos grandes y mucho aire entre bloques.
- cada grupo muestra en qué paso va: apuntándose, listos, sorteado, revelado.
- sin emojis: la interfaz es texto, íconos de línea y los íconos de la pwa.
- caritas en line-art: `public/stamps/cara-*.svg` son placeholders por si más adelante van las ilustraciones finales.
- textos en `lib/copy/es-CR.ts` con ortografía normal: mayúscula al inicio y en nombres propios, tildes, ¿ y ¡, y … en vez de tres puntos. `tests/brand.test.ts` lo comprueba, junto con el contraste de los grises y del azul.

## scripts

| comando | qué hace |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | next.js |
| `pnpm test` | vitest |
| `pnpm typecheck` / `pnpm lint` | tsc / eslint |
| `pnpm icons` | regenera íconos de la pwa y png de las caritas |
| `./scripts/deploy-sepolia.sh` | declara y despliega el contrato |
| `pnpm tsx scripts/print-server-env.ts` | variables del servidor |
| `cd contracts && snforge test` | tests del contrato |
