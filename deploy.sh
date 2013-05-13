rsync -av --delete-excluded --exclude .git --exclude clients/lib/io-2012-slides/.sass-cache ./ mp@login:~/public_html/ePeek
scp clients/index.html mp@login:~/public_html/ePeek/

