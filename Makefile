install:
	npm ci
vite:
	npx vite
build:
	npx vite build
fix:
	npx eslint --fix .
lint:
	npx eslint .