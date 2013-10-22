LIBRARY_FILES = \
	lib/core.js \
	lib/rest.js \
	lib/overlap.js

# ePeek: $(LIBRARY_FILES)
# 	smash $(LIBRARY_FILES) | uglifyjs - -c -m -o lib/$@.js


ePeek: $(LIBRARY_FILES)
	smash $(LIBRARY_FILES) > lib/$@.js && jsdoc --destination doc lib/$@.js && uglifyjs lib/$@.js > lib/$@.min.js

