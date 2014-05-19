NODE_BIN_DIR = ./node_modules/.bin
GENERATED_FILES = \
	lib/tnt.js \
	lib/tnt.min.js

all: $(GENERATED_FILES)

.PHONY: clean all test

test:
	$(NODE_BIN_DIR)/mocha-phantomjs --reporter spec test/test.html

tnt.js: $(shell node_modules/.bin/smash --list src/index.js) package.json
	@rm -f lib/$@
	$(NODE_BIN_DIR)/smash src/index.js > lib/$@
	sass src/scss/tnt.scss:lib/tnt.css	
	@chmod a-w lib/$@

tnt.min.js: tnt.js
	@rm -f $@
	$(NODE_BIN_DIR)/uglifyjs -c -m -o $@ $<
	chmod a-w $@

clean:
	rm -rf -- $(GENERATED_FILES)
