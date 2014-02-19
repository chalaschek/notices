REPORTER = spec

install:
	npm install

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha -c --reporter $(REPORTER) -t 5000 ./test/*.js

.PHONY: test