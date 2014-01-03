NODE_BIN_DIR = ./node_modules/.bin
NODE_JSDOC_TEMPLATES_DIR=./node_modules/jsdoc/templates/docstrap
GENERATED_FILES = \
	ePeek.js \
	ePeek.min.js \
	doc

all: $(GENERATED_FILES)

.PHONY: clean all

ePeek.js: $(shell node_modules/.bin/smash --list lib/index.js) package.json
	@rm -f $@
	$(NODE_BIN_DIR)/smash lib/index.js > $@
	@chmod a-w $@

ePeek.min.js: ePeek.js
	@rm -f $@
	$(NODE_BIN_DIR)/uglifyjs -c -m -o $@ $<
	chmod a-w $@

doc: ePeek.js
	$(NODE_BIN_DIR)/jsdoc $< --destination doc --template $(NODE_JSDOC_TEMPLATES_DIR) --configure $(NODE_JSDOC_TEMPLATES_DIR)/jsdoc.conf.json 

clean:
	rm -rf -- $(GENERATED_FILES)
