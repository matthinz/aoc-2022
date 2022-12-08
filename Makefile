.PHONY: check

lint:
	deno check **/*.ts
	deno lint **/*.ts
	deno fmt **/*.ts
