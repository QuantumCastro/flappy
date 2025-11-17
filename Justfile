set shell := ["pwsh", "-NoLogo", "-NoProfile", "-Command"]

default: verify

setup:
	pnpm install

lint:
	pnpm --dir frontend lint

type:
	pnpm --dir frontend type-check

test:
	pnpm --dir frontend test

build:
	pnpm --dir frontend build

verify: lint type test

