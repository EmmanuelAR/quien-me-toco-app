#!/usr/bin/env bash
# despliega el contrato en starknet sepolia con sncast.
#
# requisitos: scarb + starknet foundry (sncast) y una cuenta sncast ya desplegada (ver README).
# uso:
#   ACCOUNT=qmt-server ./scripts/deploy-sepolia.sh
# variables opcionales:
#   OWNER     dirección dueña del contrato (default: la cuenta que despliega)
#   OPERATOR  dirección del servidor (default: la cuenta que despliega)
#   RPC_URL   rpc de sepolia (default: el público de blast)
set -euo pipefail

ACCOUNT="${ACCOUNT:-qmt-server}"
RPC_URL="${RPC_URL:-https://api.zan.top/public/starknet-sepolia/rpc/v0_10}"
ACCOUNTS_FILE="${ACCOUNTS_FILE:-$HOME/.starknet_accounts/starknet_open_zeppelin_accounts.json}"

cd "$(dirname "$0")/../contracts"

ACCOUNT_ADDRESS=$(python3 - "$ACCOUNTS_FILE" "$ACCOUNT" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
acc = data.get("alpha-sepolia", {}).get(sys.argv[2])
if not acc:
    sys.exit(f"no existe la cuenta {sys.argv[2]} en {sys.argv[1]} (correr: sncast account create --network sepolia --name {sys.argv[2]})")
print(acc["address"])
PY
)

OWNER="${OWNER:-$ACCOUNT_ADDRESS}"
OPERATOR="${OPERATOR:-$ACCOUNT_ADDRESS}"

echo "cuenta:   $ACCOUNT ($ACCOUNT_ADDRESS)"
echo "owner:    $OWNER"
echo "operator: $OPERATOR"
echo

echo "→ scarb build"
scarb build

echo "→ declare"
DECLARE_OUT=$(sncast --account "$ACCOUNT" --url "$RPC_URL" declare --contract-name QuienMeToco 2>&1 || true)
echo "$DECLARE_OUT"
CLASS_HASH=$(echo "$DECLARE_OUT" | grep -ioE 'class[_ ]hash:? *0x[0-9a-f]+' | grep -ioE '0x[0-9a-f]+' | head -1 || true)
if [ -z "$CLASS_HASH" ]; then
  # ya estaba declarado: sncast lo dice en el error; tomamos el hash de ahí
  CLASS_HASH=$(echo "$DECLARE_OUT" | grep -ioE '0x[0-9a-f]{50,}' | head -1 || true)
fi
if [ -z "$CLASS_HASH" ]; then
  echo "no pude leer el class hash del declare" >&2
  exit 1
fi
echo "class hash: $CLASS_HASH"

echo "→ deploy"
DEPLOY_OUT=$(sncast --account "$ACCOUNT" --url "$RPC_URL" deploy \
  --class-hash "$CLASS_HASH" \
  --constructor-calldata "$OWNER" "$OPERATOR" 2>&1)
echo "$DEPLOY_OUT"
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUT" | grep -ioE 'contract[_ ]address:? *0x[0-9a-f]+' | grep -ioE '0x[0-9a-f]+' | head -1 || true)

echo
echo "listo. pegá esto en .env.local y en vercel:"
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo "SERVER_STARKNET_ADDRESS=$OPERATOR"
echo
echo "la llave privada del servidor sale de: pnpm tsx scripts/print-server-env.ts $ACCOUNT"
