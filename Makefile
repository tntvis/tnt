LIBRARY_FILES = \
	lib/rest.js \
	lib/overlap.js \
	lib/core.js

ePeek: $(LIBRARY_FILES)
	smash $(LIBRARY_FILES) | uglifyjs - -c -m -o lib/$@.js
