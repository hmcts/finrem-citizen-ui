#!/bin/zsh

FIRST_NAMES=("James" "Emma" "Oliver" "Sophia" "Liam" "Ava" "Noah" "Mia" "William" "Charlotte"
  "Benjamin" "Amelia" "Lucas" "Harper" "Henry" "Evelyn" "Alexander" "Abigail" "Daniel" "Emily"
  "Matthew" "Ella" "Samuel" "Grace" "David" "Lily" "Joseph" "Chloe" "Nathan" "Zoe"
  "Thomas" "Hannah" "Andrew" "Aria" "Ryan" "Nora" "Jack" "Riley" "Owen" "Layla")

LAST_NAMES=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Rodriguez" "Martinez"
  "Wilson" "Anderson" "Taylor" "Thomas" "Hernandez" "Moore" "Martin" "Jackson" "Thompson" "White"
  "Lopez" "Lee" "Harris" "Clark" "Lewis" "Robinson" "Walker" "Young" "Allen" "King"
  "Wright" "Scott" "Torres" "Hill" "Green" "Adams" "Baker" "Nelson" "Carter" "Mitchell")

PASSWORD="Password1111"
TMPFILE=$(mktemp)
trap "rm -f ${TMPFILE}" EXIT

FIRST=${FIRST_NAMES[$((RANDOM % ${#FIRST_NAMES[@]} + 1))]}
LAST=${LAST_NAMES[$((RANDOM % ${#LAST_NAMES[@]} + 1))]}
GUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
RANDOM_NUM=$((RANDOM % 9000 + 1000))
EMAIL="${(L)FIRST}${(L)LAST}${RANDOM_NUM}@mailinator.com"

TOKEN_HTTP_CODE=$(curl -s -o "${TMPFILE}" -w "%{http_code}" -L -X POST \
  'https://idam-web-public.aat.platform.hmcts.net/o/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=finrem-citizen-ui' \
  --data-urlencode 'client_secret=IDAM-SECRET' \
  --data-urlencode 'scope=profile roles')

echo "Token response: ${TOKEN_HTTP_CODE}"

if [[ "${TOKEN_HTTP_CODE}" != "200" ]]; then
  echo "ERROR: Failed to get token"
  cat "${TMPFILE}"
  exit 1
fi

ACCESS_TOKEN=$(sed -n 's/.*"access_token" *: *"\([^"]*\)".*/\1/p' "${TMPFILE}")

if [[ -z "${ACCESS_TOKEN}" ]]; then
  echo "ERROR: Could not extract access token"
  cat "${TMPFILE}"
  exit 1
fi

USER_HTTP_CODE=$(curl -s -o "${TMPFILE}" -w "%{http_code}" -L -X POST \
  'https://idam-testing-support-api.aat.platform.hmcts.net/test/idam/users' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data-raw "{
  \"password\": \"${PASSWORD}\",
  \"user\": {
    \"id\": \"${GUID}\",
    \"email\": \"${EMAIL}\",
    \"forename\": \"${FIRST}\",
    \"surname\": \"${LAST}\",
    \"roleNames\": [\"citizen\"]
  }
}")

echo "User creation response: ${USER_HTTP_CODE}"
echo ""
echo "Email: ${EMAIL}"
echo "Password: ${PASSWORD}"
