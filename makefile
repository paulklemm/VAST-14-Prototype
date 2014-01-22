update:
	cd ./data/ship-data; \
		git pull
install:
	mkdir data
	cd ./data; \
		git clone https://paule@bitbucket.org/paule/ship-data.git

	npm install
	bower install
clean:
	rm -r ./data
	rm -r ./node_modules
	rm -r ./bower_components