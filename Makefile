TARGET_NAME = ePeek

LIBRARY_FILES = \
	lib/core.js \
	lib/rest.js \
	lib/overlap.js

# ePeek: $(LIBRARY_FILES)
# 	smash $(LIBRARY_FILES) | uglifyjs - -c -m -o lib/$@.js

default: $(LIBRARY_FILES)
	smash $(LIBRARY_FILES) > lib/$(TARGET_NAME).js && jsdoc --destination doc lib/$(TARGET_NAME).js && uglifyjs lib/$(TARGET_NAME).js -c -m -o lib/$(TARGET_NAME).min.js

ePeek: $(LIBRARY_FILES)
	smash $(LIBRARY_FILES) | tee lib/$(TARGET_NAME).js | uglifyjs - -c -m -o lib/$(TARGET_NAME).min.js
