NODE_BIN_DIR = ./node_modules/.bin
GENERATED_FILES = \
	lib/ePeek.js \
	lib/ePeek.min.js

all: $(GENERATED_FILES)

.PHONY: clean all test

test:
	$(NODE_BIN_DIR)/mocha-phantomjs --reporter spec test/test.html

ePeek.js: $(shell node_modules/.bin/smash --list src/index.js) package.json
	@rm -f lib/$@
	$(NODE_BIN_DIR)/smash src/index.js > lib/$@
	node_modules/.bin/sass src/scss/ePeek.scss:lib/ePeek.css	
	@chmod a-w lib/$@

ePeek.min.js: ePeek.js
	@rm -f $@
	$(NODE_BIN_DIR)/uglifyjs -c -m -o $@ $<
	chmod a-w $@

clean:
	rm -rf -- $(GENERATED_FILES)
