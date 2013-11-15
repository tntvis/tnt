TARGET_NAME = ePeek

NODE_BIN_DIR = ./node_modules/.bin

GENERATED_FILES = \
	lib/ePeek.js \
	lib/ePeek.min.js \
	doc

all: $(GENERATED_FILES)

lib/ePeek.js: $(shell node_modules/.bin/smash --list lib/index.js) package.json
	@rm -f $@
	$(NODE_BIN_DIR)/smash lib/index.js 

LIBRARY_FILES = \
	lib/index.js

# ePeek: $(LIBRARY_FILES)
# 	smash $(LIBRARY_FILES) | uglifyjs - -c -m -o lib/$@.js

all: $(LIBRARY_FILES)
	$(NODE_BIN_DIR)/smash $(LIBRARY_FILES) > lib/$(TARGET_NAME).js && $(NODE_BIN_DIR)/jsdoc --destination doc lib/$(TARGET_NAME).js && $(NODE_BIN_DIR)/uglifyjs lib/$(TARGET_NAME).js -c -m -o lib/$(TARGET_NAME).min.js

lib: $(LIBRARY_FILES)
	$(NODE_BIN_DIR)/smash $(LIBRARY_FILES) | tee lib/$(TARGET_NAME).js | $(NODE_BIN_DIR)/uglifyjs - -c -m -o lib/$(TARGET_NAME).min.js
