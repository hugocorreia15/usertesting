all:
	latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex

clean:
	latexmk -C
	rm -f main.bbl

.PHONY: all clean
