#!/bin/bash
my_dir="$(dirname "$0")"

function build_image {
  NAME=$1
  VERSION=$2
  FOLDER=$3
  DOCKERFILE=$4

  echo "Setting up build for $NAME"
  echo

  cd "${FOLDER}"

  docker image rm "${NAME}:${VERSION}-dev" 2>/dev/null
  docker image rm "lmsdoubtfire/${NAME}:${VERSION}-dev" 2>/dev/null

  docker build -f "${DOCKERFILE}" -t "${NAME}:${VERSION}-dev" .
  if [ $? -ne 0 ]; then
    echo "Ensure that everything builds";
    exit 1
  fi

  docker tag "${NAME}:${VERSION}-dev" "lmsdoubtfire/${NAME}:${VERSION}-dev"
  if [ $? -ne 0 ]; then
    echo "Tag failed...";
    exit 1
  fi
}

build_image "numbastest-devcontainer" "1.0" "../" "dev.Dockerfile"

echo
echo "Test using:"
echo "docker compose run --rm numbastest-devcontainer /bin/zsh"
echo
