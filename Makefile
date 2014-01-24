REPORTER = spec

install:
	npm install

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha -c --reporter $(REPORTER) ./test/*.js

.PHONY: test