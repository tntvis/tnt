NODE_BIN_DIR = ./node_modules/.bin
GENERATED_FILES = \
	lib/tnt.js \
	lib/tnt.min.js \
        lib/tnt.css

all: $(GENERATED_FILES)

.PHONY: clean all test

test:
	$(NODE_BIN_DIR)/mocha-phantomjs --reporter spec test/test.html

lib/tnt.css: src/scss/tnt.scss
	@rm -f $@
	sass src/scss/tnt.scss:lib/tnt.css
	@chmod a-w $@

lib/tnt.js: $(shell node_modules/.bin/smash --list src/index.js) package.json
	@rm -f $@
	$(NODE_BIN_DIR)/smash src/index.js > $@

lib/tnt.min.js: lib/tnt.js
	@rm -f $@
	$(NODE_BIN_DIR)/uglifyjs -c -m -o $@ $<
	chmod a-w $@

reset:
	rm -rf -- $(GENERATED_FILES)
