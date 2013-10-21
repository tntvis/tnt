LIBRARY_FILES = \
	lib/core.js \
	lib/overlap.js

ePeek: $(LIBRARY_FILES)
	smash $(LIBRARY_FILES) | uglifyjs - -c -m -o lib/$@.js
