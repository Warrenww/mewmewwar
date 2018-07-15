git add .
set /p var= Please enter commit :
git commit -m '%var%'
git push 
heroku restart